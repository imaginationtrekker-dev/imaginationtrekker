'use client';

import { useEditor, EditorContent } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import { useEffect } from 'react';

interface RichTextEditorProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  hideToolbar?: boolean;
  autoBulletList?: boolean;
}

export function RichTextEditor({ value, onChange, placeholder = 'Start typing...', hideToolbar = false, autoBulletList = false }: RichTextEditorProps) {
  const editor = useEditor({
    extensions: [StarterKit],
    content: autoBulletList && (!value || !value.includes('<ul>')) ? '<ul><li></li></ul>' : value,
    immediatelyRender: false,
    onUpdate: ({ editor }) => {
      let html = editor.getHTML();
      // If autoBulletList is enabled and content is not a list, ensure it becomes one
      if (autoBulletList && !html.includes('<ul>') && !html.includes('<ol>')) {
        const text = editor.getText().trim();
        if (text) {
          // Convert to bullet list
          editor.chain().focus().selectAll().toggleBulletList().run();
          html = editor.getHTML();
        }
      }
      onChange(html);
    },
    editorProps: {
      attributes: {
        class: 'prose prose-sm max-w-none focus:outline-none min-h-[200px] p-4',
        style: 'color: #1f2937;',
      },
    },
  });

  useEffect(() => {
    if (editor && value !== editor.getHTML()) {
      // If autoBulletList is enabled, ensure content is in bullet list format
      if (autoBulletList && value && !value.includes('<ul>') && !value.includes('<ol>')) {
        // Wrap content in bullet list
        const wrappedValue = `<ul><li>${value.replace(/<p>/g, '<li>').replace(/<\/p>/g, '</li>').replace(/<br\s*\/?>/gi, '</li><li>')}</li></ul>`;
        editor.commands.setContent(wrappedValue);
      } else {
        editor.commands.setContent(value);
      }
      
      // Ensure editor is in bullet list mode if autoBulletList is enabled
      if (autoBulletList && !editor.isActive('bulletList')) {
        setTimeout(() => {
          editor.commands.toggleBulletList();
        }, 100);
      }
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
          onClick={() => editor.chain().focus().toggleBulletList().run()}
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
          onClick={() => editor.chain().focus().toggleOrderedList().run()}
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
            background: editor.isActive('heading', { level: 2 }) ? '#0d5a6f' : 'transparent',
            color: editor.isActive('heading', { level: 2 }) ? '#fff' : '#374151',
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
          onClick={() => editor.chain().focus().setParagraph().run()}
          style={{
            padding: '6px 10px',
            background: editor.isActive('paragraph') ? '#0d5a6f' : 'transparent',
            color: editor.isActive('paragraph') ? '#fff' : '#374151',
            border: '1px solid #d1d5db',
            borderRadius: '4px',
            cursor: 'pointer',
            fontSize: '13px',
          }}
          title="Paragraph"
        >
          P
        </button>
      </div>
      )}
      {/* Editor Content */}
      <div style={{ position: 'relative', minHeight: '200px', maxHeight: '400px', overflowY: 'auto' }}>
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
          .ProseMirror ul, .ProseMirror ol {
            color: #1f2937 !important;
          }
          .ProseMirror li {
            color: #1f2937 !important;
          }
          .ProseMirror strong {
            color: #1f2937 !important;
          }
          .ProseMirror em {
            color: #1f2937 !important;
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
