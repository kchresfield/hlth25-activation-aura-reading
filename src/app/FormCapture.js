'use client'
import React, { useRef, useState } from 'react';
import fetchDropdownOptions from './fetchDropdownOptions';
import Image from 'next/image';
import {put} from '@vercel/blob';

const VERCEL_BLOB_UPLOAD_URL = 'https://blob.vercel-storage.com/upload'; // Replace with your Vercel Blob endpoint

export default function FormCapture() {
  const [form, setForm] = useState({
    picture: null,
    buttonSelection: [], // changed to array for multi-select
    voice: null,
    inputText: '',
    dropdown: ''
  });
  const [recording, setRecording] = useState(false);
  const [dropdownOptions, setDropdownOptions] = useState([]);
  const [imagePreview, setImagePreview] = useState(null);
  const mediaRecorderRef = useRef(null);
  const chunksRef = useRef([]);
  const videoRef = useRef(null);
  const canvasRef = useRef(null);
  const [showCamera, setShowCamera] = useState(false);

  // Fetch dropdown options from database
  React.useEffect(() => {
    fetchDropdownOptions().then(setDropdownOptions);
  }, []);

  // Picture capture from camera
  const openCamera = () => {
    setShowCamera(true);
    navigator.mediaDevices.getUserMedia({ video: true }).then(stream => {
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
      }
    });
  };
  const takePhoto = () => {
    const video = videoRef.current;
    const canvas = canvasRef.current;
    if (video && canvas) {
      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;
      const ctx = canvas.getContext('2d');
      ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
      canvas.toBlob(blob => {
        setForm({ ...form, picture: blob });
        setImagePreview(URL.createObjectURL(blob));
        // Stop camera
        if (video.srcObject) {
          video.srcObject.getTracks().forEach(track => track.stop());
        }
        setShowCamera(false);
      }, 'image/jpeg');
    }
  };
  const handlePicture = (e) => {
    const file = e.target.files[0];
    setForm({ ...form, picture: file });
    setImagePreview(URL.createObjectURL(file));
  };

  // Multi-select button selection
  const colorOptions = [
    'Violet', 'Indigo', 'Blue', 'Green', 'Yellow', 'Orange', 'Red', 'Pink', 'Magenta', 'Turquoise', 'Tan', 'White'
  ];
  const handleButton = (val) => {
    setForm(prev => {
      const selected = prev.buttonSelection.includes(val)
        ? prev.buttonSelection.filter(v => v !== val)
        : [...prev.buttonSelection, val];
      return { ...prev, buttonSelection: selected };
    });
  };

  // Voice recording
  const startRecording = async () => {
    setRecording(true);
    const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
    mediaRecorderRef.current = new MediaRecorder(stream);
    chunksRef.current = [];
    mediaRecorderRef.current.ondataavailable = (e) => {
      if (e.data.size > 0) chunksRef.current.push(e.data);
    };
    mediaRecorderRef.current.onstop = () => {
      const blob = new Blob(chunksRef.current, { type: 'audio/webm' });
      setForm((prev) => ({ ...prev, voice: blob }));
    };
    mediaRecorderRef.current.start();
  };
  const stopRecording = () => {
    setRecording(false);
    mediaRecorderRef.current.stop();
  };

  // Input box
  const handleInput = (e) => {
    setForm({ ...form, inputText: e.target.value });
  };

  // Dropdown
  const handleDropdown = (e) => {
    setForm({ ...form, dropdown: e.target.value });
    // If manual entry is selected, clear inputText
    if (e.target.value !== 'manual') {
      setForm(prev => ({ ...prev, inputText: '' }));
    }
  };

  // Upload blob to Vercel Blob Storage ///////////////////////////////////////////////////////////////////////////////////////////
  function uploadBlobToVercel(defaultPath = "uploads/default.png") {
  async function upload(file, path = defaultPath) {
    if (!file) throw new Error("No file provided for upload");

    const blob = await put(path, file, { access: "public" });
    return blob;
  }

  return { upload };
}

  // Submit
  const handleSubmit = async (e) => {
    e.preventDefault();
    const data = new FormData();
    let pictureUrl = '';
    let voiceUrl = '';
    if (form.picture) {
      pictureUrl = await uploadBlobToVercel(form.picture, 'picture.jpg');
      data.append('pictureUrl', pictureUrl);
    }
    if (form.voice) {
      voiceUrl = await uploadBlobToVercel(form.voice, 'voice.webm');
      data.append('voiceUrl', voiceUrl);
    }
    data.append('buttonSelection', JSON.stringify(form.buttonSelection));
    data.append('inputText', form.inputText);
    data.append('dropdown', form.dropdown);
    await fetch('https://your-server.com/api/submit', {
      method: 'POST',
      body: data
    });
    alert('Form submitted!');
  };
///////////////////////////////////////////////////////////////////////////////////////////////////////////
  return (
    <form onSubmit={handleSubmit} className="space-y-4 p-4 max-w-lg mx-auto">
      <div>
        <label className="block mb-2 font-bold">Take a picture:</label>
        <input type="file" accept="image/*" capture="environment" onChange={handlePicture} className="mb-2" />
        <button type="button" onClick={openCamera} className="ml-2 bg-blue-500 text-white px-2 py-1 rounded">Use Camera</button>
        {showCamera && (
          <div className="mt-2">
            <video ref={videoRef} autoPlay style={{ width: '100%' }} />
            <button type="button" onClick={takePhoto} className="bg-green-500 text-white px-2 py-1 mt-2 rounded">Capture Photo</button>
            <canvas ref={canvasRef} style={{ display: 'none' }} />
          </div>
        )}
        {imagePreview && (
          <div className="mt-2">
            <Image src={imagePreview} alt="Preview" width={400} height={300} style={{ maxWidth: '100%', height: 'auto' }} />
          </div>
        )}
      </div>
      <div>
        <label className="block mb-2 font-bold">Select colors:</label>
        <div className="flex flex-wrap gap-3 mt-1">
          {colorOptions.map(color => (
            <button
              key={color}
              type="button"
              onClick={() => handleButton(color)}
              className={form.buttonSelection.includes(color) ? "bg-blue-500 text-white px-3 py-1 rounded" : "px-3 py-1 border rounded bg-white text-black"}
            >
              {color}
            </button>
          ))}
        </div>
      </div>
      <div>
        <label className="block mb-2 font-bold">Voice recording:</label>
        {!recording ? (
          <button type="button" onClick={startRecording} className="bg-green-500 text-white px-3 py-1 rounded">Start</button>
        ) : (
          <button type="button" onClick={stopRecording} className="bg-red-500 text-white px-3 py-1 rounded">Stop</button>
        )}
      </div>
      <div>
        <label className="block mb-2 font-bold">Dropdown:</label>
        <select value={form.dropdown} onChange={handleDropdown} className="border px-3 py-2 rounded text-black w-full bg-white">
          <option value="">Select...</option>
          {dropdownOptions.map(opt => (
            <option key={opt.value} value={opt.value}>{opt.label}</option>
          ))}
          <option value="manual">Manual Entry</option>
        </select>
      </div>
      {form.dropdown === 'manual' && (
        <div>
          <label className="block mb-2 font-bold">Manual Entry:</label>
          <input type="text" value={form.inputText} onChange={handleInput} className="border px-3 py-2 rounded text-black w-full" />
        </div>
      )}
      <button type="submit" className="bg-red-600 text-white px-6 py-3 rounded font-bold text-xl">Submit</button>
    </form>
  );
}
