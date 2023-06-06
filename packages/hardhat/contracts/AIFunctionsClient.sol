// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import "@chainlink/contracts/src/v0.8/dev/functions/FunctionsClient.sol";
import "@chainlink/contracts/src/v0.8/dev/functions/Functions.sol";
import {ConfirmedOwner} from "@chainlink/contracts/src/v0.8/ConfirmedOwner.sol";
import "./RestaurantInfo.sol";

/**
 * @title Functions Consumer contract
 * @notice A contract that uses the Functions API to receive data from web APIs
 */
contract AIFunctionsClient is FunctionsClient, ConfirmedOwner {
    using Functions for Functions.Request;

    bytes32 public latestRequestId;
    bytes public latestResponse;
    bytes public latestError;
    RestaurantInfo public restaurantInfoContract;

    event AIReviewResponse(bytes32 indexed requestId, bytes result, bytes err);

    constructor(address oracle, address restaurantInfoContractAddress) FunctionsClient(oracle) ConfirmedOwner(msg.sender) {
        restaurantInfoContract = RestaurantInfo(restaurantInfoContractAddress);
    }

    /**
   * @notice Send a review request to the AI through the DON
   *
   * @param source JavaScript source code
   * @param secrets Encrypted secrets payload
   * @param args Has one arg only. The review text to be analyzed by the AI
   * @param subscriptionId Functions billing subscription ID
   * @param gasLimit Maximum amount of gas used to call the client contract's `handleOracleFulfillment` function
   * @return Functions request ID
    */
    function executeRequest(
        string calldata source,
        bytes calldata secrets,
        string[] calldata args,
        uint64 subscriptionId,
        uint32 gasLimit
    ) public onlyRestaurantInfoContract returns (bytes32) {
        Functions.Request memory req;
        req.initializeRequest(Functions.Location.Inline, Functions.CodeLanguage.JavaScript, source);
        if (secrets.length > 0) {
            req.addRemoteSecrets(secrets);
        }
        if (args.length > 0) req.addArgs(args);

        bytes32 assignedReqID = sendRequest(req, subscriptionId, gasLimit);
        latestRequestId = assignedReqID;
        return assignedReqID;
    }

    /**
     * @notice Callback that is invoked once the DON has resolved the request or hit an error
   *
   * @param requestId The request ID, returned by sendRequest()
   * @param response Aggregated response from the user code
   * @param err Aggregated error from the user code or from the execution pipeline
   * Either response or error parameter will be set, but never both
   */
    function fulfillRequest(bytes32 requestId, bytes memory response, bytes memory err) internal override {
        latestResponse = response;
        latestError = err;
        emit AIReviewResponse(requestId, response, err);
    }

    /**
     * @notice Allows the Functions oracle address to be updated
   *
   * @param oracle New oracle address
   */
    function updateOracleAddress(address oracle) public onlyOwner {
        setOracle(oracle);
    }

    function addSimulatedRequestId(address oracleAddress, bytes32 requestId) public onlyOwner {
        addExternalRequest(oracleAddress, requestId);
    }

    modifier onlyRestaurantInfoContract() {
        require(msg.sender == address(restaurantInfoContract), "Only the restaurant info contract can call this function");
        _;
    }
}