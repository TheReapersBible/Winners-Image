import posthog from "posthog-js";

posthog.init("phc_D87fTEchJtUe6DdPccD43RD7njivjYW6sbAbaZVvdZoc", {
  api_host: "https://app.posthog.com",
  capture_pageview: false
});

export default posthog;