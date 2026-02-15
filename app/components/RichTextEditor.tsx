'use client';

import { useEditor, EditorContent } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import Underline from '@tiptap/extension-underline';
import Image from '@tiptap/extension-image';
import { useEffect, useRef, useState } from 'react';
import { Image as ImageIcon } from 'lucide-react';

interface RichTextEditorProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  hideToolbar?: boolean;
  autoBulletList?: boolean;
  enableImageUpload?: boolean;
}

export function RichTextEditor({ value, onChange, placeholder = 'Start typing...', hideToolbar = false, autoBulletList = false, enableImageUpload = false }: RichTextEditorProps) {
  const isUpdatingRef = useRef(false);
  const lastValueRef = useRef(value);
  
  const editor = useEditor({
    extensions: [
      StarterKit.configure({
        // Disable default image handling if we're using custom image extension
      }),
      Underline,
      Image.configure({
        inline: false,
        allowBase64: false,
        HTMLAttributes: {
          class: 'editor-image',
        },
      }),
    ],
    content: autoBulletList && (!value || !value.includes('<ul>')) ? '<ul><li></li></ul>' : value,
    immediatelyRender: false,
    onUpdate: ({ editor }) => {
      // Prevent infinite loop
      if (isUpdatingRef.current) return;
      
      let html = editor.getHTML();
      
      // Remove <p> tags from inside <li> tags
      html = html.replace(/<li[^>]*>\s*<p[^>]*>/gi, '<li>');
      html = html.replace(/<\/p>\s*<\/li>/gi, '</li>');
      
      // If autoBulletList is enabled and content is not a list, ensure it becomes one
      if (autoBulletList && !html.includes('<ul>') && !html.includes('<ol>')) {
        const text = editor.getText().trim();
        if (text) {
          // Convert to bullet list
          editor.chain().focus().selectAll().toggleBulletList().run();
          html = editor.getHTML();
          // Clean up again after conversion
          html = html.replace(/<li[^>]*>\s*<p[^>]*>/gi, '<li>');
          html = html.replace(/<\/p>\s*<\/li>/gi, '</li>');
        }
      }
      
      // Only call onChange if content actually changed
      if (html !== lastValueRef.current) {
        lastValueRef.current = html;
        onChange(html);
      }
    },
    editorProps: {
      attributes: {
        class: 'prose prose-sm max-w-none focus:outline-none min-h-[200px] p-4',
        style: 'color: #1f2937;',
      },
    },
  });

  useEffect(() => {
    if (!editor) return;
    
    const currentHtml = editor.getHTML();
    // Normalize both values for comparison
    const normalizedValue = value || '';
    const normalizedCurrent = currentHtml || '';
    
    // Only update if values are actually different (avoid infinite loop)
    if (normalizedValue === normalizedCurrent || isUpdatingRef.current) {
      return;
    }
    
    // Prevent infinite loop
    isUpdatingRef.current = true;
    
    try {
      // Clean up value: remove <p> tags from inside <li> tags
      let cleanedValue = normalizedValue.replace(/<li[^>]*>\s*<p[^>]*>/gi, '<li>');
      cleanedValue = cleanedValue.replace(/<\/p>\s*<\/li>/gi, '</li>');
      
      // Ensure images are properly formatted for TipTap
      // TipTap Image extension expects <img> tags with src attribute
      cleanedValue = cleanedValue.replace(/<img([^>]*?)>/gi, (match, attrs) => {
        // Extract src from attributes
        const srcMatch = attrs.match(/src=["']([^"']+)["']/i);
        const altMatch = attrs.match(/alt=["']([^"']*)["']/i);
        const src = srcMatch ? srcMatch[1] : '';
        const alt = altMatch ? altMatch[1] : '';
        if (src) {
          return `<img src="${src}" alt="${alt}" />`;
        }
        return match;
      });
      
      // If autoBulletList is enabled, ensure content is in bullet list format
      if (autoBulletList && cleanedValue && !cleanedValue.includes('<ul>') && !cleanedValue.includes('<ol>')) {
        // Wrap content in bullet list
        const wrappedValue = `<ul><li>${cleanedValue.replace(/<p>/g, '<li>').replace(/<\/p>/g, '</li>').replace(/<br\s*\/?>/gi, '</li><li>')}</li></ul>`;
        editor.commands.setContent(wrappedValue);
      } else {
        editor.commands.setContent(cleanedValue);
      }
      
      lastValueRef.current = cleanedValue;
      
      // Ensure editor is in bullet list mode if autoBulletList is enabled
      if (autoBulletList && !editor.isActive('bulletList')) {
        setTimeout(() => {
          editor.commands.toggleBulletList();
        }, 100);
      }
    } finally {
      // Reset flag after a short delay to allow onUpdate to complete
      setTimeout(() => {
        isUpdatingRef.current = false;
      }, 100);
    }
  }, [value, editor, autoBulletList]);

  if (!editor) {
    return (
      <div style={{ padding: '12px', border: '1px solid #d1d5db', borderRadius: '6px', background: '#fff', minHeight: '200px' }}>
        Loading editor...
      </div>
    );
  }

  return (
    <div style={{ border: '1px solid #d1d5db', borderRadius: '8px', background: '#fff', overflow: 'hidden' }}>
      {/* Toolbar */}
      {!hideToolbar && (
      <div style={{ 
        borderBottom: '1px solid #e5e7eb', 
        padding: '8px 12px', 
        display: 'flex', 
        gap: '4px', 
        flexWrap: 'wrap',
        background: '#f9fafb',
      }}>
        <button
          type="button"
          onClick={() => editor.chain().focus().toggleBold().run()}
          style={{
            padding: '6px 10px',
            background: editor.isActive('bold') ? '#0d5a6f' : 'transparent',
            color: editor.isActive('bold') ? '#fff' : '#374151',
            border: '1px solid #d1d5db',
            borderRadius: '4px',
            cursor: 'pointer',
            fontSize: '13px',
            fontWeight: editor.isActive('bold') ? 700 : 400,
          }}
          title="Bold"
        >
          <strong>B</strong>
        </button>
        <button
          type="button"
          onClick={() => editor.chain().focus().toggleItalic().run()}
          style={{
            padding: '6px 10px',
            background: editor.isActive('italic') ? '#0d5a6f' : 'transparent',
            color: editor.isActive('italic') ? '#fff' : '#374151',
            border: '1px solid #d1d5db',
            borderRadius: '4px',
            cursor: 'pointer',
            fontSize: '13px',
            fontStyle: 'italic',
          }}
          title="Italic"
        >
          I
        </button>
        <button
          type="button"
          onClick={() => editor.chain().focus().toggleUnderline().run()}
          style={{
            padding: '6px 10px',
            background: editor.isActive('underline') ? '#0d5a6f' : 'transparent',
            color: editor.isActive('underline') ? '#fff' : '#374151',
            border: '1px solid #d1d5db',
            borderRadius: '4px',
            cursor: 'pointer',
            fontSize: '13px',
            textDecoration: 'underline',
          }}
          title="Underline"
        >
          U
        </button>
        <button
          type="button"
          onClick={() => {
            // If already in bullet list, toggle it off
            if (editor.isActive('bulletList')) {
              editor.chain().focus().toggleBulletList().run();
              return;
            }
            
            // If in ordered list, switch to bullet list
            if (editor.isActive('orderedList')) {
              editor.chain().focus().toggleOrderedList().toggleBulletList().run();
              return;
            }
            
            // For selected text, TipTap's toggleBulletList automatically converts paragraphs to list items
            // We need to ensure selection spans full paragraphs for proper conversion
            const { $from, $to } = editor.state.selection;
            const hasSelection = $from.pos !== $to.pos;
            
            if (hasSelection) {
              // Find paragraph boundaries for selection
              let startPos = $from.pos;
              let endPos = $to.pos;
              
              // Expand selection to start of first paragraph
              const startNode = $from.node($from.depth);
              if (startNode.type.name === 'paragraph') {
                startPos = $from.start($from.depth);
              }
              
              // Expand selection to end of last paragraph
              const endNode = $to.node($to.depth);
              if (endNode.type.name === 'paragraph') {
                endPos = $to.end($to.depth);
              }
              
              // Set selection to paragraph boundaries and toggle list
              editor.chain()
                .focus()
                .setTextSelection({ from: startPos, to: endPos })
                .toggleBulletList()
                .run();
            } else {
              // No selection, toggle list for current paragraph
              editor.chain().focus().toggleBulletList().run();
            }
          }}
          style={{
            padding: '6px 10px',
            background: editor.isActive('bulletList') ? '#0d5a6f' : 'transparent',
            color: editor.isActive('bulletList') ? '#fff' : '#374151',
            border: '1px solid #d1d5db',
            borderRadius: '4px',
            cursor: 'pointer',
            fontSize: '13px',
          }}
          title="Bullet List"
        >
          •
        </button>
        <button
          type="button"
          onClick={() => {
            // If already in ordered list, toggle it off
            if (editor.isActive('orderedList')) {
              editor.chain().focus().toggleOrderedList().run();
              return;
            }
            
            // If in bullet list, switch to ordered list
            if (editor.isActive('bulletList')) {
              editor.chain().focus().toggleBulletList().toggleOrderedList().run();
              return;
            }
            
            // For selected text, TipTap's toggleOrderedList automatically converts paragraphs to list items
            // We need to ensure selection spans full paragraphs for proper conversion
            const { $from, $to } = editor.state.selection;
            const hasSelection = $from.pos !== $to.pos;
            
            if (hasSelection) {
              // Find paragraph boundaries for selection
              let startPos = $from.pos;
              let endPos = $to.pos;
              
              // Expand selection to start of first paragraph
              const startNode = $from.node($from.depth);
              if (startNode.type.name === 'paragraph') {
                startPos = $from.start($from.depth);
              }
              
              // Expand selection to end of last paragraph
              const endNode = $to.node($to.depth);
              if (endNode.type.name === 'paragraph') {
                endPos = $to.end($to.depth);
              }
              
              // Set selection to paragraph boundaries and toggle list
              editor.chain()
                .focus()
                .setTextSelection({ from: startPos, to: endPos })
                .toggleOrderedList()
                .run();
            } else {
              // No selection, toggle list for current paragraph
              editor.chain().focus().toggleOrderedList().run();
            }
          }}
          style={{
            padding: '6px 10px',
            background: editor.isActive('orderedList') ? '#0d5a6f' : 'transparent',
            color: editor.isActive('orderedList') ? '#fff' : '#374151',
            border: '1px solid #d1d5db',
            borderRadius: '4px',
            cursor: 'pointer',
            fontSize: '13px',
          }}
          title="Numbered List"
        >
          1.
        </button>
        <button
          type="button"
          onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()}
          style={{
            padding: '6px 10px',
            background: editor.isActive('heading', { level: 2 }) && !editor.isActive('bulletList') && !editor.isActive('orderedList') ? '#0d5a6f' : 'transparent',
            color: editor.isActive('heading', { level: 2 }) && !editor.isActive('bulletList') && !editor.isActive('orderedList') ? '#fff' : '#374151',
            border: '1px solid #d1d5db',
            borderRadius: '4px',
            cursor: 'pointer',
            fontSize: '13px',
            fontWeight: 600,
          }}
          title="Heading"
        >
          H2
        </button>
        <button
          type="button"
          onClick={() => {
            // Exit list mode first if in a list
            if (editor.isActive('bulletList')) {
              editor.chain().focus().toggleBulletList().setParagraph().run();
            } else if (editor.isActive('orderedList')) {
              editor.chain().focus().toggleOrderedList().setParagraph().run();
            } else {
              editor.chain().focus().setParagraph().run();
            }
          }}
          style={{
            padding: '6px 10px',
            background: editor.isActive('paragraph') && !editor.isActive('bulletList') && !editor.isActive('orderedList') && !editor.isActive('heading') ? '#0d5a6f' : 'transparent',
            color: editor.isActive('paragraph') && !editor.isActive('bulletList') && !editor.isActive('orderedList') && !editor.isActive('heading') ? '#fff' : '#374151',
            border: '1px solid #d1d5db',
            borderRadius: '4px',
            cursor: 'pointer',
            fontSize: '13px',
          }}
          title="Paragraph"
        >
          P
        </button>
        {enableImageUpload && (
          <ImageUploadButton editor={editor} />
        )}
      </div>
      )}
      {/* Editor Content */}
      <div style={{ position: 'relative', minHeight: '200px', maxHeight: enableImageUpload ? '600px' : '400px', overflowY: 'auto' }}>
        <style dangerouslySetInnerHTML={{ __html: `
          .ProseMirror {
            color: #1f2937 !important;
            outline: none;
          }
          .ProseMirror p {
            color: #1f2937 !important;
          }
          .ProseMirror h1, .ProseMirror h2, .ProseMirror h3, .ProseMirror h4, .ProseMirror h5, .ProseMirror h6 {
            color: #1f2937 !important;
          }
          .ProseMirror ul {
            color: #1f2937 !important;
            list-style-type: disc !important;
            padding-left: 1.5rem !important;
            margin: 0.5rem 0 !important;
          }
          .ProseMirror ol {
            color: #1f2937 !important;
            list-style-type: decimal !important;
            padding-left: 1.5rem !important;
            margin: 0.5rem 0 !important;
          }
          .ProseMirror li {
            color: #1f2937 !important;
            display: list-item !important;
            margin: 0.25rem 0 !important;
            padding-left: 0.25rem !important;
          }
          .ProseMirror li p {
            display: inline !important;
            margin: 0 !important;
            padding: 0 !important;
          }
          .ProseMirror strong {
            color: #1f2937 !important;
          }
          .ProseMirror em {
            color: #1f2937 !important;
          }
          .ProseMirror u {
            color: #1f2937 !important;
            text-decoration: underline;
          }
          .ProseMirror img,
          .ProseMirror .editor-image {
            max-width: 100% !important;
            width: auto !important;
            height: auto !important;
            display: block !important;
            margin: 1rem auto !important;
            border-radius: 0.5rem !important;
            box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1) !important;
            object-fit: contain !important;
          }
          .ProseMirror figure {
            margin: 1rem 0 !important;
          }
          .ProseMirror figure img {
            max-width: 100% !important;
            height: auto !important;
          }
        `}} />
        <EditorContent editor={editor} />
        {!editor.getText() && (
          <div style={{ 
            position: 'absolute', 
            top: '16px', 
            left: '16px', 
            color: '#9ca3af', 
            pointerEvents: 'none',
            fontSize: '14px',
          }}>
            {placeholder}
          </div>
        )}
      </div>
    </div>
  );
}

// Image Upload Button Component
function ImageUploadButton({ editor }: { editor: any }) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);

  const handleImageUpload = async (file: File) => {
    try {
      setUploading(true);
      const formData = new FormData();
      formData.append('file', file);

      const response = await fetch('/api/upload-cloudinary', {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to upload image');
      }

      const { url } = await response.json();
      
      // Insert image using TipTap's image command
      // Insert at current cursor position or at the end
      if (editor && url) {
        // Temporarily disable updates to prevent loop
        const currentContent = editor.getHTML();
        editor.chain().focus().setImage({ src: url, alt: 'Uploaded image' }).run();
        
        // Force a small delay to ensure image is rendered
        await new Promise(resolve => setTimeout(resolve, 100));
      }
    } catch (error: any) {
      console.error('Error uploading image:', error);
      alert(error.message || 'Failed to upload image');
    } finally {
      setUploading(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  return (
    <>
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        onChange={(e) => {
          const file = e.target.files?.[0];
          if (file) handleImageUpload(file);
        }}
        style={{ display: 'none' }}
      />
      <button
        type="button"
        onClick={() => fileInputRef.current?.click()}
        disabled={uploading}
        style={{
          padding: '6px 10px',
          background: uploading ? '#9ca3af' : 'transparent',
          color: uploading ? '#fff' : '#374151',
          border: '1px solid #d1d5db',
          borderRadius: '4px',
          cursor: uploading ? 'not-allowed' : 'pointer',
          fontSize: '13px',
          display: 'flex',
          alignItems: 'center',
          gap: '4px',
        }}
        title="Insert Image"
      >
        <ImageIcon size={14} />
        {uploading ? 'Uploading...' : 'Image'}
      </button>
    </>
  );
}
