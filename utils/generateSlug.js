import slugify from 'slugify'; export function generateSlug(text){ return slugify(text || 'news', {lower:true, strict:true}) + '-' + Date.now(); }
