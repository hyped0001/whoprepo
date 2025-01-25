require("dotenv").config();

const OpenAI = require("openai");
const axios = require("axios");

// Initialize OpenAI
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

async function generateStoreAssets(businessName) {
  try {
    // Generate logo using DALL-E
    const logoResponse = await openai.images.generate({
      model: "dall-e-3",
      prompt: `A modern, professional logo for a business about ${businessName}. Minimal, clean design.`,
      n: 1,
      response_format: "url",
      size: "1024x1024",
    });
    const logoUrl = logoResponse.data[0].url;

    // Generate banner image
    const bannerResponse = await openai.images.generate({
      model: "dall-e-3",
      prompt: `A wide banner image representing ${businessName} business. Modern, abstract design with subtle branding.`,
      n: 1,
      size: "1792x1024",
      response_format: "url",
    });
    const bannerUrl = bannerResponse.data[0].url;

    // Generate description using GPT-4
    const descriptionResponse = await openai.chat.completions.create({
      model: "gpt-4",
      messages: [
        {
          role: "user",
          content: `Write a compelling description for a Whop store dedicated to the ${businessName} business. Include benefits, features, and a bold claim. Format in markdown.`,
        },
      ],
    });

    const description = descriptionResponse.choices[0].message.content;

    // Generate bold claim
    const claimResponse = await openai.chat.completions.create({
      model: "gpt-4",
      messages: [
        {
          role: "user",
          content: `Write a bold, attention-grabbing one-liner claim for the ${businessName} business. Maximum 60 characters.`,
        },
      ],
    });

    const boldClaim = claimResponse.choices[0].message.content.slice(0, 60);

    // Generate bold title
    const titleResponse = await openai.chat.completions.create({
      model: "gpt-4",
      messages: [
        {
          role: "user",
          content: `Write a bold, attention-grabbing one-liner title for the ${businessName} business. The title should be a single sentence that captures the essence of the business and describes the outcome. EX: for a sports betting busienss: "REAL $5,000 - $50,000 BET SLIPS DAILY FROM LAS VEGFAS! Maximum 30 characters.`,
        },
      ],
    });

    const title = titleResponse.choices[0].message.content.slice(0, 30);

    return {
      logoUrl,
      bannerUrl,
      description,
      boldClaim,
      title,
    };
  } catch (error) {
    console.error("Error generating store assets:", error);
    throw error;
  }
}

async function downloadAndConvertImage(url) {
  const response = await axios.get(url, { responseType: "arraybuffer" });
  return Buffer.from(response.data).toString("base64");
}

async function prepareStoreAssets(businessName) {
  const assets = await generateStoreAssets(businessName);

  const [logoBase64, bannerBase64, logoImageBuffer, bannerImageBuffer] =
    await Promise.all([
      downloadAndConvertImage(assets.logoUrl),
      downloadAndConvertImage(assets.bannerUrl),
      axios
        .get(assets.logoUrl, { responseType: "arraybuffer" })
        .then((response) => response.data),
      axios
        .get(assets.bannerUrl, { responseType: "arraybuffer" })
        .then((response) => response.data),
    ]);

  return {
    ...assets,
    logoBase64,
    bannerBase64,
    logoImageBuffer,
    bannerImageBuffer,
  };
}

async function createWhopStore(companyId, businessName, boldClaim) {
  try {
    let data = JSON.stringify([
      {
        companyId: companyId,
        title: businessName,
        name: businessName,
        headline: boldClaim,
        activateWhopFour: true,
      },
    ]);
    console.log(data);

    let config = {
      method: "post",
      maxBodyLength: Infinity,
      url: "https://whop.com/new/",
      headers: {
        Host: "whop.com",
        Connection: "keep-alive",
        "sec-ch-ua-platform": '"macOS"',
        "sec-ch-ua": '"Not A(Brand";v="8", "Chromium";v="132"',
        "sec-ch-ua-mobile": "?0",
        accept: "text/x-component",
        tracestate:
          "4200517@nr=0-1-4200517-1120347029-05231f6714b34668----1737770918972",
        "next-action": "e05ea7d4b495bee9e51357af2bbd573314ef1b8f",
        newrelic:
          "eyJ2IjpbMCwxXSwiZCI6eyJ0eSI6IkJyb3dzZXIiLCJhYyI6IjQyMDA1MTciLCJhcCI6IjExMjAzNDcwMjkiLCJpZCI6IjA1MjMxZjY3MTRiMzQ2NjgiLCJ0ciI6IjVhMWYyODkyNDZjNzRiZWVjZjU5ZDY3YWUwNDkyNGQyIiwidGkiOjE3Mzc3NzA5MTg5NzJ9fQ==",
        "next-url": "/en/true/false",
        "User-Agent":
          "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/132.0.0.0 Safari/537.36",
        DNT: "1",
        "x-deployment-id": "dpl_8FjNEMeTWP7yPV7Ta7FjLa4Z7BMb",
        Origin: "https://whop.com",
        "Sec-Fetch-Site": "same-origin",
        "Sec-Fetch-Mode": "cors",
        "Sec-Fetch-Dest": "empty",
        Referer: "https://whop.com/new/",
        "Accept-Language": "en-US,en;q=0.9",
        "Content-Type": "text/plain;charset=UTF-8",
        Cookie: process.env.WHOP_COOKIE,
      },
      data: data,
    };

    const response = await axios.request(config);
    console.log("create store", response.body);

    // Parse the response data which is in a special format
    const lines = response.data.split("\n");
    const dataLine = lines.find((line) => line.includes('"data"'));

    if (!dataLine) {
      throw new Error("Could not find data in response");
    }

    // Extract the JSON object from the line
    const jsonMatch = dataLine.match(/\{.*\}/);
    if (!jsonMatch) {
      throw new Error("Could not extract JSON from response");
    }

    const parsedData = JSON.parse(jsonMatch[0]);

    if (parsedData.data && parsedData.data.id && parsedData.data.route) {
      return {
        id: parsedData.data.id,
        route: parsedData.data.route,
      };
    } else {
      throw new Error("Response data missing required fields");
    }
  } catch (error) {
    if (error.response) {
      console.error(
        `HTTP error! status: ${error.response.status}, response: ${error.response.data}`
      );
    } else if (error.request) {
      console.error("No response received:", error.request);
    } else {
      console.error("Error in setting up request:", error.message);
    }
    throw error;
  }
}

async function createChatApp(productRoute, companyId, accessPassId) {
  try {
    const response = await fetch(`https://whop.com/${productRoute}/`, {
      headers: {
        accept: "text/x-component",
        "accept-language": "en-US,en;q=0.9",
        baggage:
          "sentry-environment=vercel-production,sentry-release=19bb7174cf597aa51aa10907e4c4a49515148c07,sentry-public_key=a0eeb19ab96e2033121600d07dfe6a12,sentry-trace_id=a5b47eccf42e4075b1a8e6e11a5a5721,sentry-sample_rate=0,sentry-sampled=false",
        "content-type": "text/plain;charset=UTF-8",
        newrelic:
          "eyJ2IjpbMCwxXSwiZCI6eyJ0eSI6IkJyb3dzZXIiLCJhYyI6IjQyMDA1MTciLCJhcCI6IjExMjAzNDcwMjkiLCJpZCI6IjRjOGExZWRhNjE3NWU3ZWMiLCJ0ciI6IjI4M2FiYzc2MWYyYzY5NjI2ZTdlYWM3OWQzYjYzZDU0IiwidGkiOjE3Mzc3NzU0Nzk4NTN9fQ==",
        "next-action": "b832dca966cd346c862a8ec06e3a974bdae0313b",
        "next-router-state-tree":
          "%5B%22%22%2C%7B%22children%22%3A%5B%5B%22locale%22%2C%22en%22%2C%22d%22%5D%2C%7B%22children%22%3A%5B%5B%22authenticated%22%2C%22true%22%2C%22d%22%5D%2C%7B%22children%22%3A%5B%5B%22embedded%22%2C%22false%22%2C%22d%22%5D%2C%7B%22children%22%3A%5B%22(desktop)%22%2C%7B%22children%22%3A%5B%22(store)%22%2C%7B%22children%22%3A%5B%5B%22productRoute%22%2C%22tokenization-30%22%2C%22d%22%5D%2C%7B%22children%22%3A%5B%5B%22planId%22%2C%22-%22%2C%22d%22%5D%2C%7B%22children%22%3A%5B%22(with-layout)%22%2C%7B%22children%22%3A%5B%22__PAGE__%22%2C%7B%7D%2C%22%2Ftokenization-30%2F%22%2C%22refresh%22%5D%7D%2Cnull%2Cnull%2Ctrue%5D%7D%5D%7D%5D%7D%2Cnull%2Cnull%5D%7D%2Cnull%2Cnull%5D%2C%22modal%22%3A%5B%22__DEFAULT__%22%2C%7B%7D%5D%7D%2Cnull%2Cnull%5D%7D%2Cnull%2Cnull%5D%7D%2Cnull%2Cnull%5D%7D%2Cnull%2Cnull%2Ctrue%5D",
        "sec-ch-ua": '"Not A(Brand";v="8", "Chromium";v="132"',
        "sec-ch-ua-mobile": "?0",
        "sec-ch-ua-platform": '"macOS"',
        "sec-fetch-dest": "empty",
        "sec-fetch-mode": "cors",
        "sec-fetch-site": "same-origin",
        "sentry-trace": "a5b47eccf42e4075b1a8e6e11a5a5721-a2f50a104b7a7654-0",
        traceparent: "00-283abc761f2c69626e7eac79d3b63d54-4c8a1eda6175e7ec-01",
        tracestate:
          "4200517@nr=0-1-4200517-1120347029-4c8a1eda6175e7ec----1737775479853",
        "x-deployment-id": "dpl_8FjNEMeTWP7yPV7Ta7FjLa4Z7BMb",
        Cookie: process.env.WHOP_COOKIE,
        Referer: `https://whop.com/${productRoute}/`,
        "Referrer-Policy": "strict-origin-when-cross-origin",
      },
      body: `[{"companyId":"${companyId}","accessPassId":"${accessPassId}","productRoute":"${productRoute}","appId":"app_xml5hbizmZPgUT","name":"Chat"}]`,
      method: "POST",
    });

    console.log("create chat", response.status);
    return;
  } catch (error) {
    console.error("Error creating chat app:", error);
    throw error;
  }
}

async function getPresignedUrl(fileExtension = "jpeg") {
  const response = await fetch(
    "https://whop.com/api/graphql/fetchPresignedUploadUrl/",
    {
      headers: {
        accept: "*/*",
        "accept-language": "en-US,en;q=0.9",
        baggage:
          "sentry-environment=vercel-production,sentry-release=114ce94bff2e4ca0274a74a7a94a94c60f71db1a,sentry-public_key=a0eeb19ab96e2033121600d07dfe6a12,sentry-trace_id=d324805972004e9b8a9aeb1860806996,sentry-sample_rate=0,sentry-sampled=false",
        "content-type": "application/json",
        newrelic:
          "eyJ2IjpbMCwxXSwiZCI6eyJ0eSI6IkJyb3dzZXIiLCJhYyI6IjQyMDA1MTciLCJhcCI6IjExMjAzNDcwMjkiLCJpZCI6IjQ5NjIwMzQ4M2VjZDRhMDgiLCJ0ciI6ImMzOTc3Y2U3MjAzZDI1NjJiYzY3ODc0MWZlMDU2NDg4IiwidGkiOjE3Mzc3Nzc4MjU3NjN9fQ==",
        "sec-ch-ua": '"Not A(Brand";v="8", "Chromium";v="132"',
        "sec-ch-ua-mobile": "?0",
        "sec-ch-ua-platform": '"macOS"',
        "sec-fetch-dest": "empty",
        "sec-fetch-mode": "cors",
        "sec-fetch-site": "same-origin",
        "sentry-trace": "d324805972004e9b8a9aeb1860806996-9a686bf25cd13eba-0",
        traceparent: "00-c3977ce7203d2562bc678741fe056488-496203483ecd4a08-01",
        tracestate:
          "4200517@nr=0-1-4200517-1120347029-496203483ecd4a08----1737777825763",
        "x-whop-gclid": "",
        "x-whop-id": "biz_xpYFVNnIXn36wK",
        "x-whop-introspection": "1",
        "x-whop-traffic-source": "",
        Cookie: process.env.WHOP_COOKIE,
        Referer: "https://whop.com/consstruction-12/",
        "Referrer-Policy": "strict-origin-when-cross-origin",
      },
      body: '{"query":"\\n    mutation fetchPresignedUploadUrl($input: PresignedUploadInput!) {\\n  presignedUpload(input: $input)\\n}\\n    ","variables":{"input":{"fileExtV2":"png","isPublic":true}},"operationName":"fetchPresignedUploadUrl"}',
      method: "POST",
    }
  );
  const data = await response.json();
  return data.data.presignedUpload;
}

async function uploadImageToS3(presignedUrl, imageBuffer) {
  const response = await fetch(presignedUrl, {
    method: "PUT",
    headers: {
      "Content-Type": "image/jpeg",
      Accept: "*/*",
      Origin: "https://whop.com",
      "Sec-Fetch-Site": "same-site",
      "Sec-Fetch-Mode": "cors",
      "Sec-Fetch-Dest": "empty",
    },
    body: imageBuffer,
  });

  if (!response.ok) {
    throw new Error(`Failed to upload image: ${response.status}`);
  }

  // Extract the final URL from the presigned URL
  const uploadedUrl = presignedUrl.split("?")[0];
  return uploadedUrl;
}

async function uploadLogoImage(
  imageBuffer,
  productRoute,
  companyId,
  accessPassId,
  businessName,
  boldClaim,
  description
) {
  try {
    // Step 1: Get presigned URL
    const presignedUrl = await getPresignedUrl("jpeg");
    console.log("Presigned URL:", presignedUrl);

    // Step 2: Upload image to S3
    const imageUrl = await uploadImageToS3(presignedUrl, imageBuffer);
    console.log("Uploaded Image URL:", imageUrl);

    // Step 3: Update Whop with the new image
    return await uploadWhopLogoImage(
      productRoute,
      companyId,
      accessPassId,
      imageUrl,
      businessName,
      boldClaim,
      description
    );
  } catch (error) {
    console.error("Error uploading logo image:", error);
    throw error;
  }
}

async function uploadWhopLogoImage(
  productRoute,
  companyId,
  accessPassId,
  imageUrl,
  businessName,
  boldClaim,
  description
) {
  const response = await fetch(`https://whop.com/${productRoute}/`, {
    headers: {
      accept: "text/x-component",
      "accept-language": "en-US,en;q=0.9",
      baggage:
        "sentry-environment=vercel-production,sentry-release=114ce94bff2e4ca0274a74a7a94a94c60f71db1a,sentry-public_key=a0eeb19ab96e2033121600d07dfe6a12,sentry-trace_id=a0be055d20eb4eb0a0ca1febfa4510d1,sentry-sample_rate=0,sentry-sampled=false",
      "content-type": "text/plain;charset=UTF-8",
      newrelic:
        "eyJ2IjpbMCwxXSwiZCI6eyJ0eSI6IkJyb3dzZXIiLCJhYyI6IjQyMDA1MTciLCJhcCI6IjExMjAzNDcwMjkiLCJpZCI6ImM5MmI3OTI4ODdhMzk5NzgiLCJ0ciI6ImZkMGRiZWUxZWY3ODNkMjNhOTQ2Y2JiMDQ2NGNhMDE1IiwidGkiOjE3Mzc3NzcyNjk3MjZ9fQ==",
      "next-action": "0d2386c25adce7fa1d2610040374916127470e0d",
      "next-router-state-tree":
        "%5B%22%22%2C%7B%22children%22%3A%5B%5B%22locale%22%2C%22en%22%2C%22d%22%5D%2C%7B%22children%22%3A%5B%5B%22authenticated%22%2C%22true%22%2C%22d%22%5D%2C%7B%22children%22%3A%5B%5B%22embedded%22%2C%22false%22%2C%22d%22%5D%2C%7B%22children%22%3A%5B%22(desktop)%22%2C%7B%22children%22%3A%5B%22(store)%22%2C%7B%22children%22%3A%5B%5B%22productRoute%22%2C%22tokenization-cf%22%2C%22d%22%5D%2C%7B%22children%22%3A%5B%5B%22planId%22%2C%22-%22%2C%22d%22%5D%2C%7B%22children%22%3A%5B%22(with-layout)%22%2C%7B%22children%22%3A%5B%22__PAGE__%22%2C%7B%7D%2C%22%2Ftokenization-cf%2F%22%2C%22refresh%22%5D%7D%2Cnull%2Cnull%2Ctrue%5D%7D%5D%7D%5D%7D%2Cnull%2Cnull%5D%7D%2Cnull%2Cnull%5D%2C%22modal%22%3A%5B%22__DEFAULT__%22%2C%7B%7D%5D%7D%2Cnull%2Cnull%5D%7D%2Cnull%2Cnull%5D%7D%2Cnull%2Cnull%5D%7D%2Cnull%2Cnull%2Ctrue%5D",
      "sec-ch-ua": '"Not A(Brand";v="8", "Chromium";v="132"',
      "sec-ch-ua-mobile": "?0",
      "sec-ch-ua-platform": '"macOS"',
      "sec-fetch-dest": "empty",
      "sec-fetch-mode": "cors",
      "sec-fetch-site": "same-origin",
      "sentry-trace": "a0be055d20eb4eb0a0ca1febfa4510d1-a1c87c1150539e67-0",
      traceparent: "00-fd0dbee1ef783d23a946cbb0464ca015-c92b792887a39978-01",
      tracestate:
        "4200517@nr=0-1-4200517-1120347029-c92b792887a39978----1737777269726",
      "x-deployment-id": "dpl_EwLWMxzZVg8Yuq726Pbv6xHEiqLo",
      Referer: `https://whop.com/${productRoute}/`,
      "Referrer-Policy": "strict-origin-when-cross-origin",
      Cookie: process.env.WHOP_COOKIE,
    },
    body: `[{"companyId":"${companyId}","pass":{"id":"${accessPassId}","title":"${businessName}","headline":"${boldClaim}","shortenedDescription":"${description}","creatorPitch":"$undefined","visibility":"visible","globalAffiliateStatus":"$undefined","globalAffiliatePercentage":"$undefined","redirectPurchaseUrl":"","customCta":"join","customCtaUrl":"","image":"${imageUrl}"},"images":"$undefined","affiliateAssets":"$undefined","productRoute":"${productRoute}","category":"$undefined","subcategory":"$undefined","pathname":"/${productRoute}/","upsells":"$undefined","popupPromo":{"enabled":false,"discountPercentage":"$undefined"}}]`,
    method: "POST",
  });

  console.log("logo upload status", response.status);
}

async function uploadBannerImage(
  imageBuffer,
  productRoute,
  companyId,
  accessPassId
) {
  try {
    // Step 1: Get presigned URL
    const presignedUrl = await getPresignedUrl("jpeg");
    console.log("Presigned URL:", presignedUrl);

    // Step 2: Upload image to S3
    const imageUrl = await uploadImageToS3(presignedUrl, imageBuffer);
    console.log("Uploaded Image URL:", imageUrl);

    // Step 3: Update Whop with the new image
    return await updateWhopWithImage(
      productRoute,
      companyId,
      accessPassId,
      imageUrl
    );
  } catch (error) {
    console.error("Error uploading banner image:", error);
    throw error;
  }
}

async function updateWhopWithImage(
  productRoute,
  companyId,
  accessPassId,
  imageUrl
) {
  const response = await fetch(`https://whop.com/${productRoute}/`, {
    headers: {
      accept: "text/x-component",
      "accept-language": "en-US,en;q=0.9",
      baggage:
        "sentry-environment=vercel-production,sentry-release=114ce94bff2e4ca0274a74a7a94a94c60f71db1a,sentry-public_key=a0eeb19ab96e2033121600d07dfe6a12,sentry-trace_id=353805dfff1e4d81bacb93797b500ab4,sentry-sample_rate=0,sentry-sampled=false",
      "content-type": "text/plain;charset=UTF-8",
      newrelic:
        "eyJ2IjpbMCwxXSwiZCI6eyJ0eSI6IkJyb3dzZXIiLCJhYyI6IjQyMDA1MTciLCJhcCI6IjExMjAzNDcwMjkiLCJpZCI6ImE3OGI3NzJmYzQ0NjczY2MiLCJ0ciI6ImFlNmE5YzVkMGE2ZWQzOGNkYmVmZDQ1NWY0NzI2MDQxIiwidGkiOjE3Mzc3Nzg4ODIyOTZ9fQ==",
      "next-action": "0d2386c25adce7fa1d2610040374916127470e0d",
      "next-router-state-tree":
        "%5B%22%22%2C%7B%22children%22%3A%5B%5B%22locale%22%2C%22en%22%2C%22d%22%5D%2C%7B%22children%22%3A%5B%5B%22authenticated%22%2C%22true%22%2C%22d%22%5D%2C%7B%22children%22%3A%5B%5B%22embedded%22%2C%22false%22%2C%22d%22%5D%2C%7B%22children%22%3A%5B%22(desktop)%22%2C%7B%22children%22%3A%5B%22(store)%22%2C%7B%22children%22%3A%5B%5B%22productRoute%22%2C%22consstruction-12%22%2C%22d%22%5D%2C%7B%22children%22%3A%5B%5B%22planId%22%2C%22-%22%2C%22d%22%5D%2C%7B%22children%22%3A%5B%22(with-layout)%22%2C%7B%22children%22%3A%5B%22__PAGE__%22%2C%7B%7D%2C%22%2Fconsstruction-12%2F%22%2C%22refresh%22%5D%7D%2Cnull%2Cnull%2Ctrue%5D%7D%5D%7D%5D%7D%2Cnull%2Cnull%5D%7D%2Cnull%2Cnull%5D%2C%22modal%22%3A%5B%22__DEFAULT__%22%2C%7B%7D%5D%7D%2Cnull%2Cnull%5D%7D%2Cnull%2Cnull%5D%7D%2Cnull%2Cnull%5D%7D%2Cnull%2Cnull%2Ctrue%5D",
      priority: "u=1, i",
      "sec-ch-ua": '"Not A(Brand";v="8", "Chromium";v="132"',
      "sec-ch-ua-mobile": "?0",
      "sec-ch-ua-platform": '"macOS"',
      "sec-fetch-dest": "empty",
      "sec-fetch-mode": "cors",
      "sec-fetch-site": "same-origin",
      "sentry-trace": "353805dfff1e4d81bacb93797b500ab4-b960837a8e16c34b-0",
      traceparent: "00-ae6a9c5d0a6ed38cdbefd455f4726041-a78b772fc44673cc-01",
      tracestate:
        "4200517@nr=0-1-4200517-1120347029-a78b772fc44673cc----1737778882296",
      "x-deployment-id": "dpl_EwLWMxzZVg8Yuq726Pbv6xHEiqLo",
      Cookie: process.env.WHOP_COOKIE,
      Referer: "https://whop.com/consstruction-12/",
      "Referrer-Policy": "strict-origin-when-cross-origin",
    },
    body: `[{"companyId":"${companyId}","pass":{"id":"${accessPassId}","title":"$undefined","headline":"$undefined","shortenedDescription":"$undefined","creatorPitch":"$undefined","visibility":"$undefined","globalAffiliateStatus":"$undefined","globalAffiliatePercentage":"$undefined","redirectPurchaseUrl":"$undefined","route":"$undefined"},"images":["${imageUrl}"],"affiliateAssets":"$undefined","productRoute":"${productRoute}","category":"$undefined","subcategory":"$undefined","pathname":"/${productRoute}/","upsells":"$undefined","popupPromo":{"enabled":false,"discountPercentage":"$undefined"}}]`,
    method: "POST",
  });
}

async function createEnhancedWhop(businessName) {
  try {
    console.log("Creating enhanced whop for", businessName);
    const companyId = "biz_xpYFVNnIXn36wK";

    const assets = await prepareStoreAssets(businessName);
    const { id, route } = await createWhopStore(
      companyId,
      assets.title,
      assets.boldClaim
    );

    // Upload banner image if available
    if (assets.logoImageBuffer) {
      await uploadLogoImage(
        assets.logoImageBuffer,
        route,
        companyId,
        id,
        businessName,
        assets.boldClaim,
        assets.description
      );
    }

    if (assets.bannerImageBuffer) {
      await uploadBannerImage(assets.bannerImageBuffer, route, companyId, id);
    } else {
      console.log("No banner image buffer found");
    }

    // Add chat app to the store
    await createChatApp(route, companyId, id);
    return route;
  } catch (error) {
    console.error("Error creating enhanced whop:", error);
    throw error;
  }
}

function parseTweetInstructions(tweetText) {
  try {
    // Remove @GenerateWhop mention and trim
    const cleanText = tweetText.replace(/@GenerateWhop/g, "").trim();

    // Extract token name - looking for $ symbol followed by text
    const tokenMatch = cleanText.match(/\$([A-Za-z0-9]+)/);
    if (!tokenMatch) {
      return null;
    }

    return tokenMatch[1];
  } catch (error) {
    console.error("Error parsing tweet:", error);
    return null;
  }
}

async function replyToTweet(tweetId, productRoute) {
  const response = await fetch(
    "https://x.com/i/api/graphql/_aUkOlYcrHMY3LR-lUVuSg/CreateTweet",
    {
      headers: {
        accept: "*/*",
        "accept-language": "en-US,en;q=0.9",
        authorization: process.env.TWITTER_KEY,
        "content-type": "application/json",
        priority: "u=1, i",
        "sec-ch-ua": '"Not A(Brand";v="8", "Chromium";v="132"',
        "sec-ch-ua-mobile": "?0",
        "sec-ch-ua-platform": '"macOS"',
        "sec-fetch-dest": "empty",
        "sec-fetch-mode": "cors",
        "sec-fetch-site": "same-origin",
        "x-client-transaction-id":
          "ggIfR+osS23DfDb8hb9ktfgAUBZxGiPfvL0CP+0II6MbGtibw++A2CNo4jx+Iep9iHqEx4FNSBGfKgvnNaJVRubJEIsLgQ",
        "x-client-uuid": "ec88267e-bfd6-4f4f-9175-20d8ffb5a066",
        "x-csrf-token":
          "7e658ae6c2ef040770e5bd59fc267aff07bf408ab3514630164590c8d0589cb930a25e4b2576dd16a6a06d579565d91af9cf53ec0ee4e94ad068a1562561c57696b54912840e572025b112b2fbcd9157",
        "x-twitter-active-user": "yes",
        "x-twitter-auth-type": "OAuth2Session",
        "x-twitter-client-language": "en",
        cookie: process.env.TWITTER_COOKIE,
        Referer: "https://x.com/notifications/mentions",
        "Referrer-Policy": "strict-origin-when-cross-origin",
      },
      body: `{"variables":{"tweet_text":"Here's your WHOP! https://whop.com/${productRoute}/","reply":{"in_reply_to_tweet_id":"${tweetId}","exclude_reply_user_ids":[]},"dark_request":false,"media":{"media_entities":[],"possibly_sensitive":false},"semantic_annotation_ids":[],"disallowed_reply_options":null},"features":{"premium_content_api_read_enabled":false,"communities_web_enable_tweet_community_results_fetch":true,"c9s_tweet_anatomy_moderator_badge_enabled":true,"responsive_web_grok_analyze_button_fetch_trends_enabled":false,"responsive_web_grok_analyze_post_followups_enabled":true,"responsive_web_jetfuel_frame":false,"responsive_web_grok_share_attachment_enabled":true,"responsive_web_edit_tweet_api_enabled":true,"graphql_is_translatable_rweb_tweet_is_translatable_enabled":true,"view_counts_everywhere_api_enabled":true,"longform_notetweets_consumption_enabled":true,"responsive_web_twitter_article_tweet_consumption_enabled":true,"tweet_awards_web_tipping_enabled":false,"creator_subscriptions_quote_tweet_preview_enabled":false,"longform_notetweets_rich_text_read_enabled":true,"longform_notetweets_inline_media_enabled":true,"profile_label_improvements_pcf_label_in_post_enabled":true,"rweb_tipjar_consumption_enabled":true,"responsive_web_graphql_exclude_directive_enabled":true,"verified_phone_label_enabled":false,"articles_preview_enabled":true,"rweb_video_timestamps_enabled":true,"responsive_web_graphql_skip_user_profile_image_extensions_enabled":false,"freedom_of_speech_not_reach_fetch_enabled":true,"standardized_nudges_misinfo":true,"tweet_with_visibility_results_prefer_gql_limited_actions_policy_enabled":true,"responsive_web_grok_image_annotation_enabled":true,"responsive_web_graphql_timeline_navigation_enabled":true,"responsive_web_enhance_cards_enabled":false},"queryId":"_aUkOlYcrHMY3LR-lUVuSg"}`,
      method: "POST",
    }
  );
  console.log("Reply to tweet response", response);
}
let processedTweetIds = [
  "1882969151230386272",
  "1882970220945703310",
  "1882996477053809037",
  "1883001471031198152",
  "1882999543354331140",
  "1883002213074878916",
  "1883012791940100173",
];

async function fetchNotifications() {
  const response = await fetch(
    "https://x.com/i/api/2/notifications/mentions.json?include_profile_interstitial_type=1&include_blocking=1&include_blocked_by=1&include_followed_by=1&include_want_retweets=1&include_mute_edge=1&include_can_dm=1&include_can_media_tag=1&include_ext_is_blue_verified=1&include_ext_verified_type=1&include_ext_profile_image_shape=1&skip_status=1&cards_platform=Web-12&include_cards=1&include_ext_alt_text=true&include_ext_limited_action_results=true&include_quote_count=true&include_reply_count=1&tweet_mode=extended&include_ext_views=true&include_entities=true&include_user_entities=true&include_ext_media_color=true&include_ext_media_availability=true&include_ext_sensitive_media_warning=true&include_ext_trusted_friends_metadata=true&send_error_codes=true&simple_quoted_tweet=true&count=20&requestContext=launch&ext=mediaStats%2ChighlightedLabel%2CparodyCommentaryFanLabel%2CvoiceInfo%2CbirdwatchPivot%2CsuperFollowMetadata%2CunmentionInfo%2CeditControl%2Carticle",
    {
      headers: {
        accept: "*/*",
        "accept-language": "en-US,en;q=0.9",
        authorization: process.env.TWITTER_KEY,
        "sec-ch-ua": '"Not A(Brand";v="8", "Chromium";v="132"',
        "sec-ch-ua-mobile": "?0",
        "sec-ch-ua-platform": '"macOS"',
        "sec-fetch-dest": "empty",
        "sec-fetch-mode": "cors",
        "sec-fetch-site": "same-origin",
        "x-client-transaction-id":
          "HmEVfRqz3w008PvzbdW0XgPuRC1vP4Jf+mS3vpfEnSPKPWs3zFTINdOOJZHbKWRreJIaWx04ZmeHXodHC7VDP/Y6xyauHQ",
        "x-client-uuid": "ec88267e-bfd6-4f4f-9175-20d8ffb5a066",
        "x-csrf-token":
          "7e658ae6c2ef040770e5bd59fc267aff07bf408ab3514630164590c8d0589cb930a25e4b2576dd16a6a06d579565d91af9cf53ec0ee4e94ad068a1562561c57696b54912840e572025b112b2fbcd9157",
        "x-twitter-active-user": "yes",
        "x-twitter-auth-type": "OAuth2Session",
        "x-twitter-client-language": "en",
        Cookie: process.env.TWITTER_COOKIE,
        Referer: "https://x.com/notifications/mentions",
        "Referrer-Policy": "strict-origin-when-cross-origin",
      },
      body: null,
      method: "GET",
    }
  );

  try {
    console.log("Fetching notifications...");

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const data = await response.json();
    const notifications = data.globalObjects?.tweets;

    if (notifications && typeof notifications === "object") {
      for (const key in notifications) {
        if (notifications.hasOwnProperty(key)) {
          const notification = notifications[key];
          const tweetId = notification.id_str;
          const tweetText = notification.full_text;

          // Check if the tweet has already been processed
          if (processedTweetIds.includes(tweetId)) {
            continue;
          }

          const match = tweetText.match(/@pookybypass a Whop for my (.+)/i);

          if (match) {
            const businessName = match[1];
            console.log(`Found token name: ${businessName}`);
            processedTweetIds.push(tweetId); // Add tweet ID to processed list
            // You can now proceed to create a Whop store for this token
            const route = await createEnhancedWhop(businessName);
            await replyToTweet(tweetId, route);
          }
        }
      }
    } else {
      console.error(
        "No notifications found or notifications is not an object."
      );
    }
  } catch (error) {
    console.error("Error fetching notifications:", error);
  }
}

setInterval(fetchNotifications, 10000);
