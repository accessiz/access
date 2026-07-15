
async function run() {
  const url = 'https://access.izmgmt.com/m/454b1228';
  console.log(`Fetching HTML from ${url}...`);
  
  const res = await fetch(url, {
    headers: {
      'User-Agent': 'WhatsApp/2.21.12.21 A' // WhatsApp user agent to trigger preview rendering if needed
    }
  });
  
  const html = await res.text();
  console.log(`Response status: ${res.status}`);
  
  // Find all meta tags
  const ogImageMatch = html.match(/<meta[^>]*property="og:image"[^>]*content="([^"]*)"/i) || html.match(/<meta[^>]*content="([^"]*)"[^>]*property="og:image"/i);
  const ogTitleMatch = html.match(/<meta[^>]*property="og:title"[^>]*content="([^"]*)"/i) || html.match(/<meta[^>]*content="([^"]*)"[^>]*property="og:title"/i);
  
  console.log("og:title match:", ogTitleMatch ? ogTitleMatch[0] : "Not found");
  console.log("og:image match:", ogImageMatch ? ogImageMatch[0] : "Not found");
  
  if (ogImageMatch) {
    const imageUrl = ogImageMatch[1];
    console.log(`\nFetching og:image from ${imageUrl}...`);
    const imgRes = await fetch(imageUrl);
    console.log(`Image response status: ${imgRes.status}`);
    console.log(`Image content-type: ${imgRes.headers.get('content-type')}`);
    if (imgRes.status !== 200) {
      console.log("Image body (first 500 chars):", (await imgRes.text()).substring(0, 500));
    }
  }
}

run().catch(console.error);
