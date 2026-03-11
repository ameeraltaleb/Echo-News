import React from 'react';
import ReactQuill from 'react-quill';
import 'react-quill/dist/quill.snow.css';

interface RichTextEditorProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  isRtl?: boolean;
}

const modules = {
  toolbar: [
    [{ 'header': [1, 2, 3, 4, 5, 6, false] }],
    ['bold', 'italic', 'underline', 'strike'],
    [{ 'list': 'ordered'}, { 'list': 'bullet' }],
    [{ 'align': [] }],
    [{ 'direction': 'rtl' }],
    ['link', 'image', 'video'],
    ['clean']
  ],
};

const formats = [
  'header',
  'bold', 'italic', 'underline', 'strike',
  'list', 'bullet',
  'align', 'direction',
  'link', 'image', 'video'
];

export default function RichTextEditor({ value, onChange, placeholder, isRtl }: RichTextEditorProps) {
  return (
    <div className={`rich-text-editor ${isRtl ? 'rtl-editor' : ''}`}>
      <ReactQuill
        theme="snow"
        value={value}
        onChange={onChange}
        modules={modules}
        formats={formats}
        placeholder={placeholder}
        className="bg-white rounded-lg"
      />
      <style>{`
        .rich-text-editor .ql-container {
          min-height: 300px;
          font-family: inherit;
          font-size: 1rem;
          border-bottom-left-radius: 0.5rem;
          border-bottom-right-radius: 0.5rem;
        }
        .rich-text-editor .ql-toolbar {
          border-top-left-radius: 0.5rem;
          border-top-right-radius: 0.5rem;
          background-color: #f8fafc;
        }
        .rtl-editor .ql-editor {
          direction: rtl;
          text-align: right;
          font-family: 'Tajawal', 'Cairo', sans-serif;
        }
      `}</style>
    </div>
  );
}
