'use client'
import React, { useRef, useState } from 'react';
// import fetchDropdownOptions from './fetchDropdownOptions';
import Image from 'next/image';
import { put } from '@vercel/blob';
import AudioRecorder from "./AudioRecorder";

const VERCEL_BLOB_UPLOAD_URL = 'https://blob.vercel-storage.com/upload'; // Replace with your Vercel Blob endpoint

export default function FormCapture() {
  const [form, setForm] = useState({
    picture: null,
    buttonSelection: [], // changed to array for multi-select
    voice: null,
    inputText: '',
    dropdown: ''
  });
  const [dropdownOptions, setDropdownOptions] = useState([]);
  const [imagePreview, setImagePreview] = useState(null);
  const videoRef = useRef(null);
  const canvasRef = useRef(null);
  const [showCamera, setShowCamera] = useState(false);
  const [audioSummary, setAudioSummary] = useState("");

  // Fetch dropdown options from database
  React.useEffect(() => {
    // fetchDropdownOptions().then(setDropdownOptions);
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
    'violet', 'indigo', 'blue', 'green', 'yellow', 'orange', 'red', 'pink', 'magenta', 'turquoise', 'tan', 'white'
  ];
  const handleButton = (val) => {
    setForm(prev => {
      const selected = prev.buttonSelection.includes(val)
        ? prev.buttonSelection.filter(v => v !== val)
        : [...prev.buttonSelection, val];
      return { ...prev, buttonSelection: selected };
    });
  };

  // Input box
  const handleInput = (e) => {
    setForm({ ...form, inputText: e.target.value });
  };

  // Dropdown
  const handleDropdown = (e) => {
    // setForm({ ...form, dropdown: e.target.value });
    // // If manual entry is selected, clear inputText
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
    let pictureUrl = '';
    // Upload image to Vercel Blob and get public URL
    if (form.picture) {
      const formData = new FormData();
      formData.append('photo', form.picture, 'picture.jpg'); // <-- send as 'photo'
      const res = await fetch('/api/upload-image', {
        method: 'POST',
        body: formData,
      });
      const data = await res.json();
      pictureUrl = data.url;
      console.log('Image uploaded to Vercel:', pictureUrl);
    }
    // Prepare form data for send-reading
    const submitData = new FormData();
    submitData.append('mediaUrl', pictureUrl); // <-- send as 'mediaUrl' for Twilio
    submitData.append('summary', audioSummary);
    submitData.append('buttonSelection', JSON.stringify(form.buttonSelection));
    submitData.append('inputText', form.inputText);
    submitData.append('dropdown', form.dropdown);
    await fetch("/api/send-reading", {
      method: 'POST',
      body: submitData
    });
    // alert('Form submitted!');
    // Reset form state
    setForm({
      picture: null,
      buttonSelection: [],
      voice: null,
      inputText: '',
      dropdown: ''
    });
    setImagePreview(null);
    setShowCamera(false);
    setAudioSummary("");
  };
  ///////////////////////////////////////////////////////////////////////////////////////////////////////////
  return (
    <form onSubmit={handleSubmit} className="space-y-4 p-4 max-w-lg mx-auto text-white" >
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
        <AudioRecorder onSummary={setAudioSummary} />
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
