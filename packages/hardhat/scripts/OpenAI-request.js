// Arguments can be provided when a request is initated on-chain and used in the request source code as shown below
const text = args[0];

// make HTTP request
const url = `https://api.openai.com/v1/completions`;
console.log(`HTTP Post Request to ${url}`);

if (!secrets.apiKey) {
  throw Error(
    "OPEN_AI_APIKEY environment variable not set for Open AI API",
  );
}

const body = {
  prompt: text + "».\n",
  max_tokens: 1,
  temperature: 1,
  top_p: 1,
  n: 1,
  logprobs: 5,
  stop: "\n",
  stream: false,
  model: "model-detect-v2",
};

const openAIRequest = Functions.makeHttpRequest({
  url: url,
  method: "post",
  headers: {
    Authorization: "Bearer " + secrets.apiKey,
  },
  data: body,
});

// Execute the API request (Promise)
const openAIResponse = await openAIRequest;
if (openAIResponse.error) {
  console.error(openAIResponse.error);
  throw Error("Request failed");
}

const data = openAIResponse["data"];

// extract the price
const price = data["choices"][0]["logprobs"]["top_logprobs"];
const class_max = [10, 40, 60, 80, 90];
const possible_classes = ["very unlikely", "unlikely", "unclear if it is", "possibly", "likely"];

const probs = Object.fromEntries(Object.entries(price).map(([key, value]) => [key, 100 * Math.exp(value)]));
const key_prob = probs['"'];
// let class_label = "";
// if (class_max[0] < key_prob && key_prob < class_max[class_max.length - 1]) {
//   const val = Math.max(...class_max.filter(v => v < key_prob));
//   class_label = possible_classes[class_max.indexOf(val)];
// } else if (class_max[0] > key_prob) {
//   class_label = possible_classes[0];
// } else {
//   class_label = possible_classes[possible_classes.length - 1];
// }
// const top_prob = { Class: class_label, "AI-Generated Probability": key_prob };
// console.log(`Top prob is: ${top_prob}`);

return Functions.encodeUint256(Math.round(key_prob));
