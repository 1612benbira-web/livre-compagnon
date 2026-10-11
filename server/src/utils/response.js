export const ok = (res, data = null, message = 'Opération réalisée avec succès', status = 200) =>
  res.status(status).json({ success: true, data, message });

export const created = (res, data, message = 'Ressource créée') => ok(res, data, message, 201);
