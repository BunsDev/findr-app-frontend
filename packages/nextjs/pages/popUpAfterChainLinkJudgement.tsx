import React, { useState } from "react";

interface PopupProps {
  canShowReviewAIJudgement: boolean;
  reviewAIJudgement: string;
  onClose: () => void;
}

const Popup: React.FC<PopupProps> = ({ canShowReviewAIJudgement, reviewAIJudgement, onClose }) => {

  if (!canShowReviewAIJudgement) {
    return null;
  }

  return (
    <div
      style={{
        position: "fixed",
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        zIndex: 9999,
        backgroundColor: "rgba(0, 0, 0, 0.5)", // Adds a dark semi-transparent backdrop
      }}
    >
      <div
        style={{
          background: "#fff",
          padding: "20px",
          border: "1px solid #000",
          borderRadius: "10px",
        }}
      >
        <h2>Reviewed AI Judgement</h2>
        <p>{reviewAIJudgement}</p>
        <button onClick={onClose} >Close</button>
      </div>
    </div>
  );
};

export default Popup;
