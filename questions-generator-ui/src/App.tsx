import React from "react";
import JobDescriptionInput from "./components/question";

const App: React.FC = () => {
  return (
    <div
      style={{
        backgroundColor: "#f4f6f8",
        minHeight: "100vh",
        padding: "40px",
      }}
    >
      <JobDescriptionInput />
    </div>
  );
};

export default App;
