require("dotenv").config();

const OpenAI = require("openai");
const axios = require("axios");

// Initialize OpenAI
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

async function generateStoreAssets(tokenName) {
  try {
    // Generate logo using DALL-E
    const logoResponse = await openai.images.generate({
      model: "dall-e-3",
      prompt: `A modern, professional logo for a cryptocurrency token called ${tokenName}. Minimal, clean design.`,
      n: 1,
      response_format: "url",
      size: "1024x1024",
    });
    const logoUrl = logoResponse.data[0].url;

    // Generate banner image
    const bannerResponse = await openai.images.generate({
      model: "dall-e-3",
      prompt: `A wide banner image representing ${tokenName} cryptocurrency community. Modern, abstract design with subtle branding.`,
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
          content: `Write a compelling description for a Whop store dedicated to the ${tokenName} token community. Include benefits, features, and a bold claim. Format in markdown.`,
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
          content: `Write a bold, attention-grabbing one-liner claim for the ${tokenName} token community.`,
        },
      ],
    });

    const boldClaim = claimResponse.choices[0].message.content;

    return {
      logoUrl,
      bannerUrl,
      description,
      boldClaim,
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

async function prepareStoreAssets(tokenName) {
  const assets = await generateStoreAssets(tokenName);

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

async function createWhopStore(companyId, tokenName) {
  try {
    let data = `[\n    {\n        "companyId": "${companyId}",\n        "title": "${tokenName}",\n        "name": "${tokenName}",\n        "headline": "test",\n        "activateWhopFour": true\n    }\n]`;

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
        Cookie:
          "whop_sig_id=e92e01b9-b728-4ca1-97b3-1fedd5dcddf5; __Host-authjs.csrf-token=a1ab994269750e136b102b355b63c29905aaa567fc52b8fdcd72d1187cc4685c%7Ce5cb81d9ffc5528d3ae7d854dd0ecf7f4fb7ee529df46639f32a87cc7bf07477; _gcl_au=1.1.734115784.1733332894; _ga=GA1.1.553353071.1733332894; _fbp=fb.1.1733332895110.634768154547759310; _tt_enable_cookie=1; _ttp=qRgufSI7eEJLFKGYoknK6OniNM4.tt.1; __stripe_mid=dc1b5742-6fcf-4e37-b71a-6726af0beb828aecf8; NEXT_LOCALE=en; __Secure-authjs.callback-url=https%3A%2F%2Fwhop.com%2Fviral-app-founders%2Fexp_uvJHqTZHedYkQS%2Fapp%2Fposts%2Fpost_1CJFwmQ6AgjHSGRxi3Qtw7%2F; ajs_user_id=user_JNaNG3fhSm8FP; ajs_anonymous_id=a6965878-e8a2-4a0b-9475-f0793e4fabd3; intercom-device-id-llm7ll78=b2955ce9-4d1d-4506-8550-cf2f4bdb5a1e; product-sidebar=true; whop-core.affiliate-dashboard-segment=customer; sessionSecureID=Z25dpVfmH3sgjCUoe8DdMHlOs9rr; ph_phc_AYScMQMhTs6oYVPfUq7hFfIyBTEMrjxs6nK6SiRjx0z_posthog=%7B%22distinct_id%22%3A%22user_hcuk9YBvSd4OV%22%7D; cf_clearance=qu204MzNJ0plIPwoNdM7XnlEHJ0YypI25T6nyuMbGvg-1736538633-1.2.1.1-eMnku1aKcwDuVFhK.rOfchQ8jWdypSHOfGm89znHFs_u1dkcSKUk6mp0zgaiNscSVBAhwFKgqp0kGfvis75edqL1oDmEZ28HeVwi6hq9rTk70B5lDR9MMk9jz0Pl8RrNQe03SyrFR3ZPW5L9MY7ARYyPww.mLCIScZ9gqRzQBBQ2gJW1zjpBmnMGC3hnictg7TjH9wNxJnl_e6EBRtCnOprTbXkIGWOV9dGY0lZgpEEX9br2dinKfK5F8ggLyzCXxNo8R0FuHiLqwN0rZ4beUOpSyNrZng2Zpx9C3Y6xr4kYuyM6PIljrT5V6h5H2ZZIWZSo1Wf9dUSt4.RzSNah.1A9rkLa_wumXIN8TRjVH1f1eFxj0zA5CXSG4.b0OXzmBgspru4Sn92ie5Y.PuJMew; ph_phc_wu7iKjxnL9ax9z497vFBbfnTfSAwfjmDZar6lDggVpO_posthog=%7B%22distinct_id%22%3A%22user_JNaNG3fhSm8FP%22%2C%22%24sesid%22%3A%5B1736538634988%2C%22019451c4-b5b1-7990-a9b6-d8c2aee362db%22%2C1736538633649%5D%2C%22%24epp%22%3Atrue%2C%22%24initial_person_info%22%3A%7B%22r%22%3A%22https%3A%2F%2Fwhop.com%2F%22%2C%22u%22%3A%22https%3A%2F%2Fcourses.apps.whop.com%2Fcustomer%2Fexperience%2Fexp_XZ4VL4qHGcx9p5%22%7D%7D; _clck=mygqbz%7C2%7Cfsv%7C0%7C1799; __Host-whop-core.csrf-token=16a35f57-165b-40b7-9cbb-b471c1435961; biz-id=biz_xpYFVNnIXn36wK%3Auser_JNaNG3fhSm8FP; __stripe_sid=af5681f2-d10a-4130-8dad-685796d23a25ec3065; whop-core.d2c-bounty=1737770469; whop-core.d2c-testing-a2=1737770469; whop-core.d2c-testing-again-59=1737770469; intercom-session-llm7ll78=QUhuOE1RbDNHUWZPV253czFDMUpaMS9CczRWeTlCRTUvY3JEcEdJeWVIRVRlMlR1T2tYVU9KYkI4Z1hVYjVPenhrck1NVWg2OEhTMDFCWWxlNGFiNW1td2pWNGloaGJzVUlzUlhKMFUwMkE9LS1McEZ4RVJZeTBGLzYwNi9iNGJHNmZBPT0=--6633d09f9b835bff803f43f7a27a6b367c050a68; __Secure-whop.suid=eyJhbGciOiJIUzI1NiJ9.eyJwcmV2aWV3IjpmYWxzZSwiaWF0IjoxNzM3NzcwNTg5LCJpc3MiOiJ1cm46d2hvcGNvbTpnbG9iYWwtdWlkIiwic3ViIjoidXNlcl9KTmFORzNmaFNtOEZQIiwiZXhwIjoxNzM3NzcxMTk5fQ.ItzWapbk9S3hA76g7QDbrgXJJ_KJOalC1DXL5Iow72Q; muxData=mux_viewer_id=90d1096b-c78c-48d2-90ae-1e7471580b25&msn=0.6808191336546248&sid=49577c38-58ee-4a7f-8003-edb493e3e5d8&sst=1737770590305&sex=1737772090460; whop-core.d2c-cultured=1737770592; whop-core.d2c-whop-investors=1737770592; whop-core.d2c-steven=1737770592; whop-frosted-theme=appearance:dark; whop-core.d2c-engineering-challenges=1737770907; whop-core.d2c-testing-38-c73a=1737770907; whop-core.d2c-unfiltered-whop-notes-from-steven=1737770907; __Secure-authjs.session-token=eyJhbGciOiJkaXIiLCJlbmMiOiJBMjU2R0NNIn0..ZBIdyeknVwo4TBZ0.nvofwFKOO5I3xRIhpcSdjv7smxCj6g6ouQz9euoXY27ivfOoKO7gqpmliPsgbGrqP-AlKyhArXJTe2jPTJZWjzIErO5twolrOiTl1Vd_H6ymm9OnaGa_gVzTTMSiDdiyoSmqG4AU2xEfCa9aeUA6nhQ6OcqbYHozQDzuGjf0yPjfhYT-lhdWma__H3tmk974H9tgFmJasYzMYNJvqtfe7Nda2aFGaZgzZPMB9XAR8n7Y5wXWnCwXjO7QFO3vzTt9GTKH3zmQC0o5p6R7v9UL8_KzZAx5qOE31TR9JclkaOmwr5kY9HSOrsBEZVl-T7tBZ4NIOqaDowp0x1nKKcksWXWOTh5PlQyOh9DL59v48rPeNHb3.D037Ue8OP7REjHS7KfD5og; __cf_bm=G6GOgL2hDVdNwJShVRyKX3Nzjb6tY64.0_gYU4fx1lc-1737770907-1.0.1.1-OdvdCn03IB4DISliF7c63iHu2b7L5FtzKQej1rwZbWTZQCBs69a71_2saP1SZQaS3qXlHDVUwFRk0kpjTC5XxA; whop-core.d2c-test1-e3=1737770909; _rdt_uuid=1733332895058.06c8a1ff-0225-4a02-923a-127b41120d51; _clsk=5ezx2x%7C1737770910341%7C32%7C0%7Co.clarity.ms%2Fcollect; _ga_NGD3HKQGSV=GS1.1.1737770234.40.1.1737770910.56.0.0; NEXT_LOCALE=en; __Host-whop-core.csrf-token=91de8291-cd50-48a8-8eff-6f89789f21f5",
      },
      data: data,
    };

    const response = await axios.request(config);

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
    const response = await fetch("https://whop.com/tokenization-30/", {
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
        cookie:
          "whop_sig_id=e92e01b9-b728-4ca1-97b3-1fedd5dcddf5; __Host-authjs.csrf-token=a1ab994269750e136b102b355b63c29905aaa567fc52b8fdcd72d1187cc4685c%7Ce5cb81d9ffc5528d3ae7d854dd0ecf7f4fb7ee529df46639f32a87cc7bf07477; _gcl_au=1.1.734115784.1733332894; _ga=GA1.1.553353071.1733332894; _fbp=fb.1.1733332895110.634768154547759310; _tt_enable_cookie=1; _ttp=qRgufSI7eEJLFKGYoknK6OniNM4.tt.1; __stripe_mid=dc1b5742-6fcf-4e37-b71a-6726af0beb828aecf8; NEXT_LOCALE=en; __Secure-authjs.callback-url=https%3A%2F%2Fwhop.com%2Fviral-app-founders%2Fexp_uvJHqTZHedYkQS%2Fapp%2Fposts%2Fpost_1CJFwmQ6AgjHSGRxi3Qtw7%2F; ajs_user_id=user_JNaNG3fhSm8FP; ajs_anonymous_id=a6965878-e8a2-4a0b-9475-f0793e4fabd3; intercom-device-id-llm7ll78=b2955ce9-4d1d-4506-8550-cf2f4bdb5a1e; product-sidebar=true; whop-core.affiliate-dashboard-segment=customer; sessionSecureID=Z25dpVfmH3sgjCUoe8DdMHlOs9rr; ph_phc_AYScMQMhTs6oYVPfUq7hFfIyBTEMrjxs6nK6SiRjx0z_posthog=%7B%22distinct_id%22%3A%22user_hcuk9YBvSd4OV%22%7D; cf_clearance=qu204MzNJ0plIPwoNdM7XnlEHJ0YypI25T6nyuMbGvg-1736538633-1.2.1.1-eMnku1aKcwDuVFhK.rOfchQ8jWdypSHOfGm89znHFs_u1dkcSKUk6mp0zgaiNscSVBAhwFKgqp0kGfvis75edqL1oDmEZ28HeVwi6hq9rTk70B5lDR9MMk9jz0Pl8RrNQe03SyrFR3ZPW5L9MY7ARYyPww.mLCIScZ9gqRzQBBQ2gJW1zjpBmnMGC3hnictg7TjH9wNxJnl_e6EBRtCnOprTbXkIGWOV9dGY0lZgpEEX9br2dinKfK5F8ggLyzCXxNo8R0FuHiLqwN0rZ4beUOpSyNrZng2Zpx9C3Y6xr4kYuyM6PIljrT5V6h5H2ZZIWZSo1Wf9dUSt4.RzSNah.1A9rkLa_wumXIN8TRjVH1f1eFxj0zA5CXSG4.b0OXzmBgspru4Sn92ie5Y.PuJMew; ph_phc_wu7iKjxnL9ax9z497vFBbfnTfSAwfjmDZar6lDggVpO_posthog=%7B%22distinct_id%22%3A%22user_JNaNG3fhSm8FP%22%2C%22%24sesid%22%3A%5B1736538634988%2C%22019451c4-b5b1-7990-a9b6-d8c2aee362db%22%2C1736538633649%5D%2C%22%24epp%22%3Atrue%2C%22%24initial_person_info%22%3A%7B%22r%22%3A%22https%3A%2F%2Fwhop.com%2F%22%2C%22u%22%3A%22https%3A%2F%2Fcourses.apps.whop.com%2Fcustomer%2Fexperience%2Fexp_XZ4VL4qHGcx9p5%22%7D%7D; _clck=mygqbz%7C2%7Cfsv%7C0%7C1799; __Host-whop-core.csrf-token=16a35f57-165b-40b7-9cbb-b471c1435961; biz-id=biz_xpYFVNnIXn36wK%3Auser_JNaNG3fhSm8FP; __stripe_sid=af5681f2-d10a-4130-8dad-685796d23a25ec3065; __Secure-whop.suid=eyJhbGciOiJIUzI1NiJ9.eyJwcmV2aWV3IjpmYWxzZSwiaWF0IjoxNzM3Nzc1Mjg3LCJpc3MiOiJ1cm46d2hvcGNvbTpnbG9iYWwtdWlkIiwic3ViIjoidXNlcl9KTmFORzNmaFNtOEZQIiwiZXhwIjoxNzM3Nzc1ODk3fQ.jf6tiB0AQChtzWAf3niECd199hazZV8-6qtSqD9p1m0; whop-core.d2c-testing-38-c73a=1737775355; whop-core.d2c-test2-e3=1737775355; whop-core.d2c-test1-e3=1737775355; whop-core.d2c-test2-e2=1737775355; whop-core.d2c-pepe-frog-meme-new=1737775356; whop-frosted-theme=appearance:dark; muxData=mux_viewer_id=90d1096b-c78c-48d2-90ae-1e7471580b25&msn=0.6808191336546248&sid=ea84b24f-5751-4c03-b24b-b3ac4bd86e52&sst=1737774261596&sex=1737776886688; whop-core.d2c-unfiltered-whop-notes-from-steven=1737775456; intercom-session-llm7ll78=cEpXSldvNHhRa1hYNGVLUFBiVENMRG5SaElhQUZvWk5CaGdqejZEVXFvRjdxZ3hMSWpZQVA0WXBGNmZ5YmJENTZyR1pjbmhqQXhvRm1ENDRhcml3MXJLSHY4Zm9TRERnR001SDNVL1NMZTg9LS1RTkVYaFJGRzg2clcwM1V6V1F6N0xRPT0=--955ff7357ae5a998e970d78e67fe2a22dfbf2ea3; whop-core.d2c-engineering-challenges=1737775457; whop-core.d2c-tokenization=1737775458; whop-core.d2c-pookybypass=1737775458; whop-core.d2c-tokenization-30=1737775459; _rdt_uuid=1733332895058.06c8a1ff-0225-4a02-923a-127b41120d51; _clsk=1szzlvc%7C1737775460581%7C39%7C0%7Cd.clarity.ms%2Fcollect; _ga_NGD3HKQGSV=GS1.1.1737770234.40.1.1737775461.59.0.0; __Secure-authjs.session-token=eyJhbGciOiJkaXIiLCJlbmMiOiJBMjU2R0NNIn0..FjLmXBWEFtcrPwFE.neE7LfsyCcOfKAi844ovmJUsRHdudYoAqNm2GiPvJmaEiDEGS61l-7eYTWOtdyDDItq8jePJeBMIOuW43E3oehEqNAH0l7UF2JqGty00JoIdzcolo_8RblJDBHHdAPiE-ir9W-3OcX6yfricMmvU9bC5LI7nzk_y-FDGk4zAo0sn6r8e4bn8MLfj8xzpgq2R6nKfHDlusCnBo_AsrM1TRBBcQVQjavBNHb2_K4Rewqzq_Er82c7t8tmWm74_rwKqCnJyRupouPpmiH6-_Cyb14oZo5iXhMVCvKCCSFnBRqYtwz5epObC70TPd6RH6cM914C5TTD0-qlH3bNdgVZIc73YBhE7F2CIGy0fQPdEDY8IaPGn.tUeHbfzUm_BsNnIJAXKAwQ; __cf_bm=13bxhNUoopVuKYMWhAZgoPwtD2kt0_VBzN50hvPfaLg-1737775475-1.0.1.1-J6MKwJ4ZogZt_yuaFOdbm16w6xA_GDpTQq8p9rINmU9bJ_v7loKXamgUP0Oo57lL5GMPQ3PIv_yUhI.2qr2yBQ",
        Referer: "https://whop.com/tokenization-30/",
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
        cookie:
          "whop_sig_id=e92e01b9-b728-4ca1-97b3-1fedd5dcddf5; __Host-authjs.csrf-token=a1ab994269750e136b102b355b63c29905aaa567fc52b8fdcd72d1187cc4685c%7Ce5cb81d9ffc5528d3ae7d854dd0ecf7f4fb7ee529df46639f32a87cc7bf07477; _gcl_au=1.1.734115784.1733332894; _ga=GA1.1.553353071.1733332894; _fbp=fb.1.1733332895110.634768154547759310; _tt_enable_cookie=1; _ttp=qRgufSI7eEJLFKGYoknK6OniNM4.tt.1; __stripe_mid=dc1b5742-6fcf-4e37-b71a-6726af0beb828aecf8; NEXT_LOCALE=en; __Secure-authjs.callback-url=https%3A%2F%2Fwhop.com%2Fviral-app-founders%2Fexp_uvJHqTZHedYkQS%2Fapp%2Fposts%2Fpost_1CJFwmQ6AgjHSGRxi3Qtw7%2F; ajs_user_id=user_JNaNG3fhSm8FP; ajs_anonymous_id=a6965878-e8a2-4a0b-9475-f0793e4fabd3; intercom-device-id-llm7ll78=b2955ce9-4d1d-4506-8550-cf2f4bdb5a1e; product-sidebar=true; whop-core.affiliate-dashboard-segment=customer; sessionSecureID=Z25dpVfmH3sgjCUoe8DdMHlOs9rr; ph_phc_AYScMQMhTs6oYVPfUq7hFfIyBTEMrjxs6nK6SiRjx0z_posthog=%7B%22distinct_id%22%3A%22user_hcuk9YBvSd4OV%22%7D; cf_clearance=qu204MzNJ0plIPwoNdM7XnlEHJ0YypI25T6nyuMbGvg-1736538633-1.2.1.1-eMnku1aKcwDuVFhK.rOfchQ8jWdypSHOfGm89znHFs_u1dkcSKUk6mp0zgaiNscSVBAhwFKgqp0kGfvis75edqL1oDmEZ28HeVwi6hq9rTk70B5lDR9MMk9jz0Pl8RrNQe03SyrFR3ZPW5L9MY7ARYyPww.mLCIScZ9gqRzQBBQ2gJW1zjpBmnMGC3hnictg7TjH9wNxJnl_e6EBRtCnOprTbXkIGWOV9dGY0lZgpEEX9br2dinKfK5F8ggLyzCXxNo8R0FuHiLqwN0rZ4beUOpSyNrZng2Zpx9C3Y6xr4kYuyM6PIljrT5V6h5H2ZZIWZSo1Wf9dUSt4.RzSNah.1A9rkLa_wumXIN8TRjVH1f1eFxj0zA5CXSG4.b0OXzmBgspru4Sn92ie5Y.PuJMew; ph_phc_wu7iKjxnL9ax9z497vFBbfnTfSAwfjmDZar6lDggVpO_posthog=%7B%22distinct_id%22%3A%22user_JNaNG3fhSm8FP%22%2C%22%24sesid%22%3A%5B1736538634988%2C%22019451c4-b5b1-7990-a9b6-d8c2aee362db%22%2C1736538633649%5D%2C%22%24epp%22%3Atrue%2C%22%24initial_person_info%22%3A%7B%22r%22%3A%22https%3A%2F%2Fwhop.com%2F%22%2C%22u%22%3A%22https%3A%2F%2Fcourses.apps.whop.com%2Fcustomer%2Fexperience%2Fexp_XZ4VL4qHGcx9p5%22%7D%7D; _clck=mygqbz%7C2%7Cfsv%7C0%7C1799; __Host-whop-core.csrf-token=16a35f57-165b-40b7-9cbb-b471c1435961; biz-id=biz_xpYFVNnIXn36wK%3Auser_JNaNG3fhSm8FP; __stripe_sid=af5681f2-d10a-4130-8dad-685796d23a25ec3065; muxData=mux_viewer_id=90d1096b-c78c-48d2-90ae-1e7471580b25&msn=0.6808191336546248&sid=ea84b24f-5751-4c03-b24b-b3ac4bd86e52&sst=1737774261596&sex=1737778498920; __Secure-whop.suid=eyJhbGciOiJIUzI1NiJ9.eyJwcmV2aWV3IjpmYWxzZSwiaWF0IjoxNzM3Nzc3NTUyLCJpc3MiOiJ1cm46d2hvcGNvbTpnbG9iYWwtdWlkIiwic3ViIjoidXNlcl9KTmFORzNmaFNtOEZQIiwiZXhwIjoxNzM3Nzc4MTYyfQ.2z3T5ul1OD0NIzERz87Cemm2sggSGAqe64nM4cZa14A; whop-frosted-theme=appearance:dark; intercom-session-llm7ll78=SUZBVnZzWXdRMkFldGZWQnhXYklXTm8xanlJMG11dVU3ejNOSUkyY3NwampKZGE2OXZoM2hvM2NadllOdUxRWHppM2FnZFNVTU9jNUExOXR1MmdlaXFpZ0xRZVE0NWQ5d2liaUxqNVFOaU09LS1TcHNkZnk1ZHFyVys2ck9PMnVGRVlBPT0=--88e49a592a899a4528f046af425f2ce5a56ded56; __Secure-authjs.session-token=eyJhbGciOiJkaXIiLCJlbmMiOiJBMjU2R0NNIn0..il2PzxIP5F6PJQza.VKDFluPWj10dhtyGA7QD7P0Fa4vrn7NeUMakaNcgrVAJ1WKFz8StaKuGu7ne8JStBihCAvEOA_Wq8mbKUDfy6I4zWs-iBCPw1uu_NPeK2K-2jT7t5TRM1zUsWP2sEQOgigE4i9r4jGLPENvM0esGxaSZzlQ7nmhBQlyOvgoI9_VyiyONL8CZa9JhF7IOVPG3i9QOpo2kOhUg7ZEQsdy6kE2-ZxgQuWVuie78n1Hf91Ft6tsBm2glzHM7xLD_gD0WkVfzj6z8oZqUdfdPStrquWdN3dZ4Jzd-9EPi8DHl2NKtS05aGgJ0vwLH7aiCEL-m45v15xjtL_hoHBQy7iuRH_eTCvNGL7ZPy5eHXe2pB0aZOzH2.ZikCzsJoNet94C7RCS7yKQ; whop-core.d2c-test22-d3=1737777816; whop-core.d2c-tokenization=1737777816; whop-core.d2c-tokenization-a0=1737777816; whop-core.d2c-tokenization-6a=1737777817; whop-core.d2c-consstruction-a7=1737777817; whop-core.d2c-tokenization-cf=1737777817; whop-core.d2c-constructionsite=1737777817; whop-core.d2c-testing-38-c73a=1737777817; whop-core.d2c-test1-e3=1737777817; whop-core.d2c-test2-e3=1737777817; whop-core.d2c-test2-e2=1737777817; whop-core.d2c-consstruction-12=1737777817; whop-core.d2c-test2-df=1737777817; whop-core.d2c-test55-67=1737777817; _rdt_uuid=1733332895058.06c8a1ff-0225-4a02-923a-127b41120d51; _clsk=1szzlvc%7C1737777818284%7C88%7C0%7Cd.clarity.ms%2Fcollect; _ga_NGD3HKQGSV=GS1.1.1737770234.40.1.1737777818.59.0.0; __cf_bm=mh5hjwmXyjF3wqsD064T3odmldTMs837wF2L5GAXuic-1737777819-1.0.1.1-z.ZO0Z9LEOAg5WvoQgBC7fQS_pbjG8yZymj5Z.GMHjgBNqtOrE6LgdUtZgzTR_Zs5ZpZzO03gAkdd7rQpgMKMQ",
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

async function uploaLogoImage(
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
    return await uploadWhopLogoImage(
      productRoute,
      companyId,
      accessPassId,
      imageUrl
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
  imageUrl
) {
  const response = await fetch("https://whop.com/tokenization-cf/", {
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
      cookie:
        "whop_sig_id=e92e01b9-b728-4ca1-97b3-1fedd5dcddf5; __Host-authjs.csrf-token=a1ab994269750e136b102b355b63c29905aaa567fc52b8fdcd72d1187cc4685c%7Ce5cb81d9ffc5528d3ae7d854dd0ecf7f4fb7ee529df46639f32a87cc7bf07477; _gcl_au=1.1.734115784.1733332894; _ga=GA1.1.553353071.1733332894; _fbp=fb.1.1733332895110.634768154547759310; _tt_enable_cookie=1; _ttp=qRgufSI7eEJLFKGYoknK6OniNM4.tt.1; __stripe_mid=dc1b5742-6fcf-4e37-b71a-6726af0beb828aecf8; NEXT_LOCALE=en; __Secure-authjs.callback-url=https%3A%2F%2Fwhop.com%2Fviral-app-founders%2Fexp_uvJHqTZHedYkQS%2Fapp%2Fposts%2Fpost_1CJFwmQ6AgjHSGRxi3Qtw7%2F; ajs_user_id=user_JNaNG3fhSm8FP; ajs_anonymous_id=a6965878-e8a2-4a0b-9475-f0793e4fabd3; intercom-device-id-llm7ll78=b2955ce9-4d1d-4506-8550-cf2f4bdb5a1e; product-sidebar=true; whop-core.affiliate-dashboard-segment=customer; sessionSecureID=Z25dpVfmH3sgjCUoe8DdMHlOs9rr; ph_phc_AYScMQMhTs6oYVPfUq7hFfIyBTEMrjxs6nK6SiRjx0z_posthog=%7B%22distinct_id%22%3A%22user_hcuk9YBvSd4OV%22%7D; cf_clearance=qu204MzNJ0plIPwoNdM7XnlEHJ0YypI25T6nyuMbGvg-1736538633-1.2.1.1-eMnku1aKcwDuVFhK.rOfchQ8jWdypSHOfGm89znHFs_u1dkcSKUk6mp0zgaiNscSVBAhwFKgqp0kGfvis75edqL1oDmEZ28HeVwi6hq9rTk70B5lDR9MMk9jz0Pl8RrNQe03SyrFR3ZPW5L9MY7ARYyPww.mLCIScZ9gqRzQBBQ2gJW1zjpBmnMGC3hnictg7TjH9wNxJnl_e6EBRtCnOprTbXkIGWOV9dGY0lZgpEEX9br2dinKfK5F8ggLyzCXxNo8R0FuHiLqwN0rZ4beUOpSyNrZng2Zpx9C3Y6xr4kYuyM6PIljrT5V6h5H2ZZIWZSo1Wf9dUSt4.RzSNah.1A9rkLa_wumXIN8TRjVH1f1eFxj0zA5CXSG4.b0OXzmBgspru4Sn92ie5Y.PuJMew; ph_phc_wu7iKjxnL9ax9z497vFBbfnTfSAwfjmDZar6lDggVpO_posthog=%7B%22distinct_id%22%3A%22user_JNaNG3fhSm8FP%22%2C%22%24sesid%22%3A%5B1736538634988%2C%22019451c4-b5b1-7990-a9b6-d8c2aee362db%22%2C1736538633649%5D%2C%22%24epp%22%3Atrue%2C%22%24initial_person_info%22%3A%7B%22r%22%3A%22https%3A%2F%2Fwhop.com%2F%22%2C%22u%22%3A%22https%3A%2F%2Fcourses.apps.whop.com%2Fcustomer%2Fexperience%2Fexp_XZ4VL4qHGcx9p5%22%7D%7D; _clck=mygqbz%7C2%7Cfsv%7C0%7C1799; __Host-whop-core.csrf-token=16a35f57-165b-40b7-9cbb-b471c1435961; biz-id=biz_xpYFVNnIXn36wK%3Auser_JNaNG3fhSm8FP; __stripe_sid=af5681f2-d10a-4130-8dad-685796d23a25ec3065; whop-frosted-theme=appearance:dark; intercom-session-llm7ll78=R0YrTHcySGRSQ0EzTWhYSUNqV1pmUzFRekxVdXRMMGMxWnJiOGxtSnhkN0dQU0h6dlVCRGZmTTlQZkliYVF2elduVlpFQm4xZWxveUM3R09qNEg1U3E5N0lBdkRPODdIb0dHZU9TK3RvVDA9LS1GMTlPclpyOGJHUzlVNW1WOWlRYUdnPT0=--27d2fbe82e65307d8d58307dffba6e65ea81e088; __Secure-whop.suid=eyJhbGciOiJIUzI1NiJ9.eyJwcmV2aWV3IjpmYWxzZSwiaWF0IjoxNzM3Nzc2OTk2LCJpc3MiOiJ1cm46d2hvcGNvbTpnbG9iYWwtdWlkIiwic3ViIjoidXNlcl9KTmFORzNmaFNtOEZQIiwiZXhwIjoxNzM3Nzc3NjA2fQ.zOqv4eEl4p-PSrQ_4i5nsC9_LoXhOVT13SQ9860Rw6A; muxData=mux_viewer_id=90d1096b-c78c-48d2-90ae-1e7471580b25&msn=0.6808191336546248&sid=ea84b24f-5751-4c03-b24b-b3ac4bd86e52&sst=1737774261596&sex=1737778498920; __Secure-authjs.session-token=eyJhbGciOiJkaXIiLCJlbmMiOiJBMjU2R0NNIn0..ChXP07O8boCT5ryr.0HSLB5J5Wr9xVaEzejjGnjTffcd1KdaYOtXIfgabh_l2CSveLIpsMB2ZLT03OVgW0Je6JheDqt5jZgr3MC4NBfO1HT2KlSBA1aHEWvOi_5bvdPAA0RoeTx3csYaX3T6ixnbTUGzuYZED-NC6UJDNEy2zERyWBpkHWBlsgFmvZmzSFnuI64ZO0Lpwe14hqTcWLwIUOapQ5Ya4cpyxZWteWcDalU2iC5An0ipg-oxjofZaQoTMOo0E-W-7ulZ8fes5cgc6PASZeTupugduDvFnkUfuuOEz-53UmG1cvLq4lBoxUgwaaQpoM8nqYfcpeHQO6e8ddm07ON45Ix4yeenaDlt2SGdVBlU4ChM4LUjJIDx1_kgK.xkhQK3b8HgH0KokBHOFdYQ; whop-core.d2c-tokenization-59=1737777251; whop-core.d2c-tokenization-34=1737777251; whop-core.d2c-testing-38-c73a=1737777251; whop-core.d2c-tokenization-30=1737777251; whop-core.d2c-tokenization-6a=1737777251; whop-core.d2c-test1-e3=1737777251; whop-core.d2c-test2-e3=1737777251; whop-core.d2c-test2-df=1737777251; whop-core.d2c-test2-e2=1737777251; whop-core.d2c-tokenization-cf=1737777252; _rdt_uuid=1733332895058.06c8a1ff-0225-4a02-923a-127b41120d51; _clsk=1szzlvc%7C1737777252604%7C83%7C0%7Cd.clarity.ms%2Fcollect; _ga_NGD3HKQGSV=GS1.1.1737770234.40.1.1737777253.56.0.0; __cf_bm=6vnRS_wqdCSUBDWOPg7OP59gfU.mXlP0QYrQVo65qbo-1737777269-1.0.1.1-kba.VGESriLoop_rtk0XQNV1BPxC_V.FvMRnRmMu154kF7LrwU.MMJf8WdnHYsC.J6wKQsWKmh5CGmJpqAlwGA",
      Referer: "https://whop.com/tokenization-cf/",
      "Referrer-Policy": "strict-origin-when-cross-origin",
    },
    body: `[{"companyId":"${companyId}","pass":{"id":"${accessPassId}","title":"${tokenName}","headline":"Tokenization WHOP","shortenedDescription":"$undefined","creatorPitch":"$undefined","visibility":"visible","globalAffiliateStatus":"$undefined","globalAffiliatePercentage":"$undefined","redirectPurchaseUrl":"","customCta":"join","customCtaUrl":"","image":"${imageUrl}"},"images":"$undefined","affiliateAssets":"$undefined","productRoute":"${productRoute}","category":"$undefined","subcategory":"$undefined","pathname":"/${productRoute}/","upsells":"$undefined","popupPromo":{"enabled":false,"discountPercentage":"$undefined"}}]`,
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

async function createEnhancedWhop(tokenName) {
  try {
    console.log("Creating enhanced whop for", tokenName);
    const companyId = "biz_xpYFVNnIXn36wK";

    const assets = await prepareStoreAssets(tokenName);
    const { id, route } = await createWhopStore(companyId, tokenName);

    // Upload banner image if available
    if (assets.logoImageBuffer) {
      await uploaLogoImage(assets.logoImageBuffer, route, companyId, id);
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
  fetch("https://x.com/i/api/graphql/_aUkOlYcrHMY3LR-lUVuSg/CreateTweet", {
    headers: {
      accept: "*/*",
      "accept-language": "en-US,en;q=0.9",
      authorization: process.env.TWITTER_KEY,
      "content-type": "application/json",
      "sec-ch-ua": '"Not A(Brand";v="8", "Chromium";v="132"',
      "sec-ch-ua-mobile": "?0",
      "sec-ch-ua-platform": '"macOS"',
      "sec-fetch-dest": "empty",
      "sec-fetch-mode": "cors",
      "sec-fetch-site": "same-origin",
      "x-client-transaction-id":
        "ucvQBsSLfFDLJeXKKILzikrqMgBcgogAmY4ZsIGLpMRte2aj1df/E4wQH8tkGMGdcuNB/brspL2sdD0PaO8U2J+uiLN3ug",
      "x-client-uuid": "ec88267e-bfd6-4f4f-9175-20d8ffb5a066",
      "x-csrf-token":
        "6ca947b4fd335753a4c9f8132bc508612d0981da07ce20f953fe7b7acd79de6d70244b1ee2826f238772dfb26aad21038d6279c6ca20540585fad5398a260e6897518a4547331b8c3257c6bdac6b1147",
      "x-twitter-active-user": "yes",
      "x-twitter-auth-type": "OAuth2Session",
      "x-twitter-client-language": "en",
      cookie:
        'lang=en; kdt=QqLrDEE3Z7ttNOQU2cnmA5GhTZk8WTfDrl8WJlap; _tracking_consent=%7B%22con%22%3A%7B%22CMP%22%3A%7B%22a%22%3A%22%22%2C%22m%22%3A%22%22%2C%22p%22%3A%22%22%2C%22s%22%3A%22%22%7D%7D%2C%22v%22%3A%222.1%22%2C%22region%22%3A%22USTX%22%2C%22reg%22%3A%22%22%2C%22purposes%22%3A%7B%22a%22%3Atrue%2C%22p%22%3Atrue%2C%22m%22%3Atrue%2C%22t%22%3Atrue%7D%2C%22display_banner%22%3Afalse%2C%22sale_of_data_region%22%3Afalse%2C%22consent_id%22%3A%22E708A820-2b28-4800-9f36-baa464cb2bf9%22%7D; _shopify_y=1780fada-80e2-4c75-97c1-38901aba63c9; intercom-device-id-jgtierkz=4630ae01-83f9-45cf-bf8f-c387ec3c56de; ads_prefs="HBIRAAA="; auth_multi="1114611046407446529:1f9cb587f6f349c09c1ff0e5b7387dda9905a9e0"; auth_token=0a2b2a25d29ea0ad9d224f5dd7a4dd88d45c4370; guest_id=v1%3A173601204911849958; twid=u%3D3181780159; ct0=6ca947b4fd335753a4c9f8132bc508612d0981da07ce20f953fe7b7acd79de6d70244b1ee2826f238772dfb26aad21038d6279c6ca20540585fad5398a260e6897518a4547331b8c3257c6bdac6b1147; d_prefs=MjoxLGNvbnNlbnRfdmVyc2lvbjoyLHRleHRfdmVyc2lvbjoxMDAw; des_opt_in=Y; ph_phc_TXdpocbGVeZVm5VJmAsHTMrCofBQu3e0kN8HGMNGTVW_posthog=%7B%22distinct_id%22%3A%2201949afc-ffc2-7f22-bdc8-6ff383252030%22%2C%22%24sesid%22%3A%5B1737769003660%2C%2201949afc-ffc1-76fe-9846-04fc5972c99e%22%2C1737767059393%5D%7D; intercom-session-jgtierkz=NWhuSTRBNnhpTUE1Sy9MVTlTNHZMZ1loYmhtUWRaS3VRMitSRE5KUjYyZUdjTzBmRzh1WEIzWDN6aWxNQ1d3U0ZNQ0dGNEVQakVmZUU5QU9seGVocWFWRWtYd0Fmai9HbmpzcElZV3g2SDA9LS1JeHNOZHhNNUdmajZ4SVdmd2hGek13PT0=--cd264bf0cad5ac4fa3c43678702baabc878fabf6; guest_id_marketing=v1%3A173601204911849958; guest_id_ads=v1%3A173601204911849958; personalization_id="v1_Kry03FDC31tIAvF4Oi+wqg=="',
      Referer: "https://x.com/compose/post",
      "Referrer-Policy": "strict-origin-when-cross-origin",
    },
    body: `{"variables":{"tweet_text":"Here\'s your WHOP! https://whop.com/${productRoute}/","reply":{"in_reply_to_tweet_id":"${tweetId}","exclude_reply_user_ids":[]},"dark_request":false,"media":{"media_entities":[],"possibly_sensitive":false},"semantic_annotation_ids":[],"disallowed_reply_options":null},"features":{"premium_content_api_read_enabled":false,"communities_web_enable_tweet_community_results_fetch":true,"c9s_tweet_anatomy_moderator_badge_enabled":true,"responsive_web_grok_analyze_button_fetch_trends_enabled":false,"responsive_web_grok_analyze_post_followups_enabled":true,"responsive_web_jetfuel_frame":false,"responsive_web_grok_share_attachment_enabled":true,"responsive_web_edit_tweet_api_enabled":true,"graphql_is_translatable_rweb_tweet_is_translatable_enabled":true,"view_counts_everywhere_api_enabled":true,"longform_notetweets_consumption_enabled":true,"responsive_web_twitter_article_tweet_consumption_enabled":true,"tweet_awards_web_tipping_enabled":false,"creator_subscriptions_quote_tweet_preview_enabled":false,"longform_notetweets_rich_text_read_enabled":true,"longform_notetweets_inline_media_enabled":true,"profile_label_improvements_pcf_label_in_post_enabled":true,"rweb_tipjar_consumption_enabled":true,"responsive_web_graphql_exclude_directive_enabled":true,"verified_phone_label_enabled":false,"articles_preview_enabled":true,"rweb_video_timestamps_enabled":true,"responsive_web_graphql_skip_user_profile_image_extensions_enabled":false,"freedom_of_speech_not_reach_fetch_enabled":true,"standardized_nudges_misinfo":true,"tweet_with_visibility_results_prefer_gql_limited_actions_policy_enabled":true,"responsive_web_grok_image_annotation_enabled":true,"responsive_web_graphql_timeline_navigation_enabled":true,"responsive_web_enhance_cards_enabled":false},"queryId":"_aUkOlYcrHMY3LR-lUVuSg"}`,
    method: "POST",
  });
}
let processedTweetIds = [
  "1882969151230386272",
  "1882970220945703310",
  "1882996477053809037",
  "1883002213074878916",
  "1882999543354331140",
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
          "UVAe0QlSjqn99vdKXUD+94OOeSfA8bqvZ1IDT/tyH2UrQHtEg/bqNgfJf+TGbHiSR9eiFVJv3KA8HtXpdSExgtOMuPq1Ug",
        "x-client-uuid": "ec88267e-bfd6-4f4f-9175-20d8ffb5a066",
        "x-csrf-token":
          "6ca947b4fd335753a4c9f8132bc508612d0981da07ce20f953fe7b7acd79de6d70244b1ee2826f238772dfb26aad21038d6279c6ca20540585fad5398a260e6897518a4547331b8c3257c6bdac6b1147",
        "x-twitter-active-user": "yes",
        "x-twitter-auth-type": "OAuth2Session",
        "x-twitter-client-language": "en",
        cookie:
          'lang=en; kdt=QqLrDEE3Z7ttNOQU2cnmA5GhTZk8WTfDrl8WJlap; _tracking_consent=%7B%22con%22%3A%7B%22CMP%22%3A%7B%22a%22%3A%22%22%2C%22m%22%3A%22%22%2C%22p%22%3A%22%22%2C%22s%22%3A%22%22%7D%7D%2C%22v%22%3A%222.1%22%2C%22region%22%3A%22USTX%22%2C%22reg%22%3A%22%22%2C%22purposes%22%3A%7B%22a%22%3Atrue%2C%22p%22%3Atrue%2C%22m%22%3Atrue%2C%22t%22%3Atrue%7D%2C%22display_banner%22%3Afalse%2C%22sale_of_data_region%22%3Afalse%2C%22consent_id%22%3A%22E708A820-2b28-4800-9f36-baa464cb2bf9%22%7D; _shopify_y=1780fada-80e2-4c75-97c1-38901aba63c9; intercom-device-id-jgtierkz=4630ae01-83f9-45cf-bf8f-c387ec3c56de; ads_prefs="HBIRAAA="; auth_multi="1114611046407446529:1f9cb587f6f349c09c1ff0e5b7387dda9905a9e0"; auth_token=0a2b2a25d29ea0ad9d224f5dd7a4dd88d45c4370; guest_id=v1%3A173601204911849958; twid=u%3D3181780159; ct0=6ca947b4fd335753a4c9f8132bc508612d0981da07ce20f953fe7b7acd79de6d70244b1ee2826f238772dfb26aad21038d6279c6ca20540585fad5398a260e6897518a4547331b8c3257c6bdac6b1147; d_prefs=MjoxLGNvbnNlbnRfdmVyc2lvbjoyLHRleHRfdmVyc2lvbjoxMDAw; des_opt_in=Y; guest_id_marketing=v1%3A173601204911849958; guest_id_ads=v1%3A173601204911849958; personalization_id="v1_0iPIE8eqbSkmnqBcvOxNPA=="; _ga=GA1.2.1093685426.1737768776; _gid=GA1.2.698916503.1737768776; ph_phc_TXdpocbGVeZVm5VJmAsHTMrCofBQu3e0kN8HGMNGTVW_posthog=%7B%22distinct_id%22%3A%2201949afc-ffc2-7f22-bdc8-6ff383252030%22%2C%22%24sesid%22%3A%5B1737769003660%2C%2201949afc-ffc1-76fe-9846-04fc5972c99e%22%2C1737767059393%5D%7D; intercom-session-jgtierkz=TlUwcUZTN2ZpL3Y1L05SWHVmRm13NG9TeTJ4Z2FQcFBMVVlWbXROcWdWeE1QMGRSNysyMklwbFVpTjFmTTFubzEzOGQ5aHBVZHlraTNPa3RNV3YxMnlQTmxON0NKYzh2bXA0UTRkS3pTK2s9LS0renErWFc0cmsyWnIzUnJRQWRNd1pnPT0=--de1bff6aeb8c0c8ff6941d8e46cf488fd7f00380',
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

          const match = tweetText.match(
            /@pookybypass a Whop for my (?:[a-zA-Z\s]+)?\$?([A-Za-z0-9_]+)/i
          );

          if (match) {
            const tokenName = match[1];
            console.log(`Found token name: $${tokenName}`);
            processedTweetIds.push(tweetId); // Add tweet ID to processed list
            // You can now proceed to create a Whop store for this token
            const route = await createEnhancedWhop(tokenName);
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
