const { db, FieldValue } = require("./firebaseAdmin");
const { id } = require("./ids");

const now = () => new Date().toISOString();

// ---------- Admins ----------
async function getAdminByEmailAndRole(email, role) {
  const snap = await db.collection("admins").where("email", "==", email).where("role", "==", role).limit(1).get();
  if (snap.empty) return null;
  return { id: snap.docs[0].id, ...snap.docs[0].data() };
}

async function getAdminByEmail(email) {
  const snap = await db.collection("admins").where("email", "==", email).limit(1).get();
  if (snap.empty) return null;
  return { id: snap.docs[0].id, ...snap.docs[0].data() };
}

async function createAdmin({ email, passwordHash, role, clientName }) {
  const adminId = id("adm");
  await db.collection("admins").doc(adminId).set({
    email, password_hash: passwordHash, role, client_name: clientName || null, created_at: now()
  });
  return adminId;
}

async function listClientAdmins() {
  const snap = await db.collection("admins").where("role", "==", "client_admin").orderBy("created_at", "desc").get();
  return snap.docs.map((d) => ({ id: d.id, email: d.data().email, client_name: d.data().client_name, created_at: d.data().created_at }));
}

// ---------- Polls ----------
async function createPoll({ ownerAdminId, name }) {
  const pollId = id("poll");
  await db.collection("polls").doc(pollId).set({
    owner_admin_id: ownerAdminId, name, voting_status: "draft", service_status: "active",
    otp_required: true, results_public: false, open_voting: false, created_at: now()
  });
  return pollId;
}

async function resetPollVotes(pollId) {
  const votesSnap = await db.collection("votes").where("poll_id", "==", pollId).get();
  const batch1 = db.batch();
  votesSnap.docs.forEach((d) => batch1.delete(d.ref));
  await batch1.commit();

  const categoriesSnap = await db.collection("categories").where("poll_id", "==", pollId).get();
  for (const catDoc of categoriesSnap.docs) {
    const nomSnap = await db.collection("nominees").where("category_id", "==", catDoc.id).get();
    const batch2 = db.batch();
    nomSnap.docs.forEach((d) => batch2.update(d.ref, { votes: 0 }));
    await batch2.commit();
  }

  const votersSnap = await db.collection("voters").where("poll_id", "==", pollId).get();
  const batch3 = db.batch();
  votersSnap.docs.forEach((d) => batch3.update(d.ref, { status: "not_started", voted_at: null }));
  await batch3.commit();
}

async function getPollById(pollId) {
  const doc = await db.collection("polls").doc(pollId).get();
  return doc.exists ? { id: doc.id, ...doc.data() } : null;
}

async function getPollOwnedByAdmin(pollId, adminId) {
  const poll = await getPollById(pollId);
  return poll && poll.owner_admin_id === adminId ? poll : null;
}

async function countVoters(pollId, status) {
  let q = db.collection("voters").where("poll_id", "==", pollId);
  if (status) q = q.where("status", "==", status);
  const snap = await q.count().get();
  return snap.data().count;
}

async function listPollsForAdmin(adminId) {
  const snap = await db.collection("polls").where("owner_admin_id", "==", adminId).orderBy("created_at", "desc").get();
  const polls = [];
  for (const doc of snap.docs) {
    const poll = { id: doc.id, ...doc.data() };
    const [voterCount, votedCount] = await Promise.all([countVoters(poll.id), countVoters(poll.id, "voted")]);
    polls.push({ ...poll, voter_count: voterCount, voted_count: votedCount });
  }
  return polls;
}

async function updatePollFields(pollId, fields) {
  await db.collection("polls").doc(pollId).update(fields);
}

async function deletePoll(pollId) {
  const wipe = async (query) => {
    const snap = await query.get();
    await Promise.all(snap.docs.map((d) => d.ref.delete()));
  };
  await wipe(db.collection("categories").where("poll_id", "==", pollId));
  await wipe(db.collection("nominees").where("poll_id", "==", pollId));
  await wipe(db.collection("voters").where("poll_id", "==", pollId));
  await wipe(db.collection("votes").where("poll_id", "==", pollId));
  await db.collection("polls").doc(pollId).delete();
}

async function listAllPollsWithStats() {
  const snap = await db.collection("polls").orderBy("created_at", "desc").get();
  const results = [];
  for (const doc of snap.docs) {
    const poll = { id: doc.id, ...doc.data() };
    const adminDoc = await db.collection("admins").doc(poll.owner_admin_id).get();
    const a = adminDoc.exists ? adminDoc.data() : {};
    const [voterCount, votedCount] = await Promise.all([countVoters(poll.id), countVoters(poll.id, "voted")]);
    results.push({ ...poll, client_name: a.client_name, client_email: a.email, voter_count: voterCount, voted_count: votedCount });
  }
  return results;
}

async function updatePollServiceStatus(pollId, serviceStatus) {
  await db.collection("polls").doc(pollId).update({ service_status: serviceStatus });
}

async function writeAuditLog({ pollId, actor, action, detail }) {
  await db.collection("auditLog").add({ poll_id: pollId, actor, action, detail, created_at: now() });
}

// ---------- Categories & nominees ----------
async function listCategoriesWithNominees(pollId) {
  const catSnap = await db.collection("categories").where("poll_id", "==", pollId).orderBy("sort_order", "asc").get();
  const categories = [];
  for (const doc of catSnap.docs) {
    const category = { id: doc.id, ...doc.data() };
    const nomSnap = await db.collection("nominees").where("category_id", "==", category.id).get();
    category.nominees = nomSnap.docs.map((n) => ({ id: n.id, ...n.data() }));
    categories.push(category);
  }
  return categories;
}

async function createCategory(pollId, name) {
  const countSnap = await db.collection("categories").where("poll_id", "==", pollId).count().get();
  const categoryId = id("cat");
  await db.collection("categories").doc(categoryId).set({ poll_id: pollId, name, sort_order: countSnap.data().count });
  return categoryId;
}

async function getCategory(pollId, categoryId) {
  const doc = await db.collection("categories").doc(categoryId).get();
  return doc.exists && doc.data().poll_id === pollId ? { id: doc.id, ...doc.data() } : null;
}

async function renameCategory(categoryId, name) {
  await db.collection("categories").doc(categoryId).update({ name });
}

async function deleteCategory(pollId, categoryId) {
  const nomSnap = await db.collection("nominees").where("category_id", "==", categoryId).get();
  await Promise.all(nomSnap.docs.map((d) => d.ref.delete()));
  await db.collection("categories").doc(categoryId).delete();
}

async function createNominee(pollId, categoryId, { name, photoUrl }) {
  const nomineeId = id("nom");
  await db.collection("nominees").doc(nomineeId).set({
    poll_id: pollId, category_id: categoryId, name, photo_url: photoUrl || null, votes: 0
  });
  return nomineeId;
}

async function getNominee(pollId, nomineeId) {
  const doc = await db.collection("nominees").doc(nomineeId).get();
  return doc.exists && doc.data().poll_id === pollId ? { id: doc.id, ...doc.data() } : null;
}

async function updateNominee(nomineeId, { name, photoUrl }) {
  const updates = {};
  if (name !== undefined) updates.name = name;
  if (photoUrl !== undefined) updates.photo_url = photoUrl;
  await db.collection("nominees").doc(nomineeId).update(updates);
}

async function deleteNominee(nomineeId) {
  await db.collection("nominees").doc(nomineeId).delete();
}

// ---------- Voters ----------
async function listVoters(pollId) {
  const snap = await db.collection("voters").where("poll_id", "==", pollId).orderBy("email", "asc").get();
  return snap.docs.map((d) => ({ id: d.id, ...d.data() }));
}

async function bulkAddVoters(pollId, rows) {
  const existingSnap = await db.collection("voters").where("poll_id", "==", pollId).get();
  const existingEmails = new Set(existingSnap.docs.map((d) => d.data().email));
  const batch = db.batch();
  let added = 0;
  for (const row of rows) {
    if (existingEmails.has(row.email)) continue;
    batch.set(db.collection("voters").doc(id("vtr")), {
      poll_id: pollId, email: row.email, name: row.name || null, status: "not_started", voted_at: null
    });
    existingEmails.add(row.email);
    added++;
  }
  await batch.commit();
  return added;
}

async function getVoterByEmail(pollId, email) {
  const snap = await db.collection("voters").where("poll_id", "==", pollId).where("email", "==", email).limit(1).get();
  if (snap.empty) return null;
  return { id: snap.docs[0].id, ...snap.docs[0].data() };
}

async function getVoterById(voterId) {
  const doc = await db.collection("voters").doc(voterId).get();
  return doc.exists ? { id: doc.id, ...doc.data() } : null;
}

async function resetVoter(voterId) {
  await db.collection("voters").doc(voterId).update({
    status: "not_started",
    otp_hash: FieldValue.delete(), otp_expires_at: FieldValue.delete(),
    otp_attempts: FieldValue.delete(), otp_resends: FieldValue.delete(), otp_last_sent_at: FieldValue.delete()
  });
}

async function deleteVoter(voterId) {
  await db.collection("voters").doc(voterId).delete();
}

async function createVoter(pollId, email) {
  const voterId = id("vtr");
  const voter = { poll_id: pollId, email, name: null, status: "not_started", voted_at: null };
  await db.collection("voters").doc(voterId).set(voter);
  return { id: voterId, ...voter };
}

// ---------- OTP (stored as fields on the voter doc, not a separate table) ----------
async function setOtp(voterId, { hash, expiresAt, resends }) {
  await db.collection("voters").doc(voterId).update({
    status: "otp_sent", otp_hash: hash, otp_expires_at: expiresAt, otp_attempts: 0,
    otp_resends: resends, otp_last_sent_at: now()
  });
}

async function incrementOtpAttempts(voterId) {
  await db.collection("voters").doc(voterId).update({ otp_attempts: FieldValue.increment(1) });
}

async function clearOtp(voterId) {
  await db.collection("voters").doc(voterId).update({
    otp_hash: FieldValue.delete(), otp_expires_at: FieldValue.delete(),
    otp_attempts: FieldValue.delete(), otp_resends: FieldValue.delete(), otp_last_sent_at: FieldValue.delete()
  });
}

// ---------- Votes ----------
async function submitBallot({ pollId, voterId, selections }) {
  await db.runTransaction(async (tx) => {
    const voterRef = db.collection("voters").doc(voterId);
    const voterDoc = await tx.get(voterRef);
    if (!voterDoc.exists || voterDoc.data().status === "voted") throw new Error("ALREADY_VOTED");

    const entries = Object.entries(selections);
    const nomineeRefs = entries.map(([, nomineeId]) => db.collection("nominees").doc(nomineeId));
    const nomineeDocs = await Promise.all(nomineeRefs.map((ref) => tx.get(ref)));

    entries.forEach(([categoryId], i) => {
      const n = nomineeDocs[i];
      if (!n.exists || n.data().category_id !== categoryId || n.data().poll_id !== pollId) {
        throw new Error("INVALID_SELECTION");
      }
    });

    entries.forEach(([categoryId, nomineeId], i) => {
      tx.set(db.collection("votes").doc(id("vote")), {
        poll_id: pollId, category_id: categoryId, nominee_id: nomineeId, voter_id: voterId, created_at: now()
      });
      tx.update(nomineeRefs[i], { votes: FieldValue.increment(1) });
    });

    tx.update(voterRef, { status: "voted", voted_at: now() });
  });
}

async function getTallyForPoll(pollId) {
  const categories = await db.collection("categories").where("poll_id", "==", pollId).orderBy("sort_order", "asc").get();
  const tally = [];
  for (const catDoc of categories.docs) {
    const category = { id: catDoc.id, ...catDoc.data() };
    const nomSnap = await db.collection("nominees").where("category_id", "==", category.id).orderBy("votes", "desc").get();
    tally.push({ category, nominees: nomSnap.docs.map((d) => ({ id: d.id, ...d.data() })) });
  }
  return tally;
}

module.exports = {
  getAdminByEmailAndRole, getAdminByEmail, createAdmin, listClientAdmins,
  createPoll, getPollById, getPollOwnedByAdmin, listPollsForAdmin, updatePollFields, deletePoll,
  listAllPollsWithStats, updatePollServiceStatus, writeAuditLog,
  listCategoriesWithNominees, createCategory, getCategory, renameCategory, deleteCategory,
  createNominee, getNominee, updateNominee, deleteNominee,
  listVoters, bulkAddVoters, getVoterByEmail, getVoterById, resetVoter, deleteVoter,
  setOtp, incrementOtpAttempts, clearOtp, submitBallot, getTallyForPoll, createVoter, resetPollVotes
};