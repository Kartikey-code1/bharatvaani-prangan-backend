export function prepareYouTubePost(article){
  return { title: article.headline, description: `${article.shortDescription}\n\n#BharatvaaniPrangan #BreakingNews #HindiNews #IndiaNews` };
}
