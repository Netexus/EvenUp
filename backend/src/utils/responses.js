export const ok = (res, data, meta) => res.json({ ok: true, data, meta });
export const created = (res, data) => res.status(201).json({ ok: true, data });
export const badRequest = (res, message) => res.status(400).json({ ok: false, message });
export const unauthorized = (res, message='Unauthorized') => res.status(401).json({ ok: false, message });
export const forbidden = (res, message='Forbidden') => res.status(403).json({ ok: false, message });
export const notFound = (res, message='Not found') => res.status(404).json({ ok: false, message });