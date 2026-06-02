export async function postToFacebook(article){
  // TODO: Use official Facebook Graph API with FACEBOOK_PAGE_ID and FACEBOOK_ACCESS_TOKEN
  return { platform:'facebook', status:'pending', article:article._id };
}
