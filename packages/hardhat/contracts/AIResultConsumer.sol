// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import "@chainlink/contracts/src/v0.8/ChainlinkClient.sol";


contract AIResultConsumer is ChainlinkClient{
    using Chainlink for Chainlink.Request;

    address private oracle;
    bytes32 private jobId;
    uint256 private fee;

    int256 public isTextLikelyGeneratedByAI; //TODO: Store as a number from 0 to 100 and process to probalility in UI

    constructor(address _oracle, bytes32 _jobId, uint256 _fee) public {
        setPublicChainlinkToken();
        oracle = _oracle;
        jobId = _jobId;
        fee = _fee;
    }

    // Function to request the nested isTextLikelyGeneratedByAI
    function requestNestedisTextLikelyGeneratedByAI(string memory s) external returns (bytes32 requestId) {
        Chainlink.Request memory req = buildChainlinkRequest(jobId, address(this), this.setisTextLikelyGeneratedByAI.selector);
        req.add("post", "https://api.openai.com/v1/completions");
        req.add("header", "Content-Type: application/json");
        req.add("body", buildJsonRequestBody(s));
        req.add("path", "choices.logprobs.top_logprobs.!"); // Access the nested isTextLikelyGeneratedByAI value

        // Use the "multiply" adapter to shift the decimal to the left by a fixed number of places (e.g., 10^18)
        req.addInt("times", 10**18);
//        req.addInt("pow", exponent);
//        req.addInt("div", e**(18 * exponent));

        return sendChainlinkRequestTo(oracle, req, fee);
    }

    // Function to build the JSON object as a string
    function buildJsonRequestBody(string memory text) public pure returns (string memory) {
        string memory value1 = unicode'{"prompt":"';
        string memory value3 = unicode' ».\\n<|disc_score|>",\"max_tokens\":1,\"temperature\":1,\"top_p\":1,\"n\":1,\"logprobs\":5,\"stop\":\"\\n\",\"stream\":false,\"model\":\"model-detect-v2\"}';
        return string(abi.encodePacked(value1, text, value3));
    }


    // Callback function to handle the fulfillment for isTextLikelyGeneratedByAI
    function setisTextLikelyGeneratedByAI(bytes32 _requestId, int256 _value) external recordChainlinkFulfillment(_requestId) {
        isTextLikelyGeneratedByAI = _value;
    }
}
