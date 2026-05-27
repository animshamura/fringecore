import { getRecord, updateRecord } from "./utils/records.mjs";

const locks = new Map();

const enqueue = (id, fn, type) => new Promise((resolve, reject) => {
  if (!locks.has(id)) locks.set(id, { q: [], readers: 0, writer: false, waitW: 0 });
  const l = locks.get(id);
  l.q.push({ fn, resolve, reject, type });
  process(id);
});

const process = async id => {
  const l = locks.get(id);
  if (!l || l.running) return;
  const nextW = l.q.findIndex(x => x.type === "write");
  if (nextW !== -1) l.waitW = 1;
  if (!l.writer && !l.waitW) {
    const rs = l.q.filter(x => x.type === "read");
    if (rs.length) {
      l.readers = rs.length;
      l.q = l.q.filter(x => x.type !== "read");
      rs.forEach(t => run(id, t));
      return;
    }
  }
  if (!l.writer && !l.readers && l.q.length) {
    const t = l.q.shift();
    if (t.type === "write") { l.writer = true; l.waitW = 0; run(id, t); }
  }
};

const run = async (id, t) => {
  const l = locks.get(id);
  try { t.resolve(await t.fn()); }
  catch (e) { t.reject(e); }
  finally {
    if (t.type === "read") l.readers--; else l.writer = false;
    if (!l.readers && !l.writer) l.q.length ? process(id) : locks.delete(id);
  }
};

const delay = (ms = 1000) => new Promise(r => setTimeout(r, ms));

export const processReadRequest = async (req, res) => {
  try {
    const r = await enqueue(req.params.id, async () => {
      await delay(); return await getRecord(req.params.id);
    }, "read");
    res.status(200).json(r);
  } catch (e) { res.status(500).json({ error: e.message }); }
};

export const processWriteRequest = async (req, res) => {
  try {
    const u = await enqueue(req.params.id, async () => {
      await delay(); return await updateRecord(req.params.id, req.body);
    }, "write");
    res.status(200).json(u);
  } catch (e) { res.status(500).json({ error: e.message }); }
};
