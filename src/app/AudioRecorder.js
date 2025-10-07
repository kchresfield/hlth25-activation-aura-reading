"use client";
import { useState, useRef } from "react";

export default function AudioRecorder({ onSummary }) {
  const [recording, setRecording] = useState(false);
  const [summary, setSummary] = useState("");
  const mediaRecorderRef = useRef(null);
  const audioChunksRef = useRef([]);

  const startRecording = async () => {
    const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
    mediaRecorderRef.current = new MediaRecorder(stream);
    audioChunksRef.current = [];
    mediaRecorderRef.current.ondataavailable = (e) => audioChunksRef.current.push(e.data);
    mediaRecorderRef.current.start();
    setRecording(true);
  };

  const stopRecording = async () => {
    return new Promise((resolve) => {
      mediaRecorderRef.current.onstop = () => {
        const audioBlob = new Blob(audioChunksRef.current, { type: "audio/webm" });
        audioChunksRef.current = [];
        setRecording(false);
        resolve(audioBlob);
      };
      mediaRecorderRef.current.stop();
    });
  };

  const handleRecordAndSummarize = async () => {
    const audioBlob = await stopRecording();
    const formData = new FormData();
    formData.append("file", audioBlob, "aura-recording.webm");

    const res = await fetch("/api/upload-audio", {
      method: "POST",
      body: formData,
    });

    const data = await res.json();
    if (onSummary) onSummary(data.summary || "");
    setSummary(data.summary);
  };

  return (
    <div style={{ padding: "2rem", fontFamily: "sans-serif" }}>
      {!recording ? (
        <button className="bg-green-500 text-white px-3 py-1 rounded" type="button" onClick={startRecording}>Start Recording</button>
      ) : (
        <button className="bg-red-500 text-white px-3 py-1 rounded" type="button" onClick={handleRecordAndSummarize} >Stop & Summarize</button>
      )}
      <h2>Summary</h2>
      <pre>{summary}</pre>
    </div>
  );
}