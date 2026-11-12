// FastAPI validation errors (422) send `detail` as a list of objects. Rendering
// that in a toast or <Alert> crashes React, so turn it into one readable string.
export const normalizeDetail = (detail) => {
  if (detail == null || typeof detail === 'string') return detail;
  if (Array.isArray(detail)) {
    return detail
      .map((d) => {
        const field = Array.isArray(d?.loc) ? d.loc.filter((x) => x !== 'body' && x !== 'query').join('.') : '';
        return field ? `${field}: ${d?.msg ?? 'invalid'}` : (d?.msg ?? String(d));
      })
      .join('; ');
  }
  return typeof detail === 'object' ? (detail.msg || JSON.stringify(detail)) : String(detail);
};
