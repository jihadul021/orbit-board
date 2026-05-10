import { useEditor, EditorContent } from '@tiptap/react'
import StarterKit from '@tiptap/starter-kit'

const ToolbarButton = ({ onClick, active, children }) => (
  <button
    type="button"
    onMouseDown={(e) => { e.preventDefault(); onClick(); }}
    className={`px-2.5 py-1.5 rounded text-sm font-medium transition-colors ${
      active ? 'bg-indigo-100 text-indigo-700' : 'text-slate-600 hover:bg-gray-100'
    }`}
  >
    {children}
  </button>
)

export default function ArticleEditor({ content, onChange, editable = true, title, onTitleChange }) {
  const editor = useEditor({
    extensions: [StarterKit],
    content: content || '',
    editable,
    onUpdate: ({ editor }) => {
      onChange?.(editor.getJSON())
    },
  })

  if (!editor) return null

  return (
    <div className="flex flex-col border border-gray-200 rounded-lg overflow-hidden">

      {/* Toolbar */}
      {editable && (
        <div className="flex items-center space-x-1 px-3 py-2 border-b border-gray-200 bg-gray-50 flex-wrap gap-1">
          <ToolbarButton onClick={() => editor.chain().focus().toggleBold().run()} active={editor.isActive('bold')}>
            <strong>B</strong>
          </ToolbarButton>
          <ToolbarButton onClick={() => editor.chain().focus().toggleItalic().run()} active={editor.isActive('italic')}>
            <em>I</em>
          </ToolbarButton>
          <ToolbarButton onClick={() => editor.chain().focus().toggleStrike().run()} active={editor.isActive('strike')}>
            <s>S</s>
          </ToolbarButton>

          <div className="w-px h-5 bg-gray-300 mx-1" />

          <ToolbarButton onClick={() => editor.chain().focus().toggleHeading({ level: 1 }).run()} active={editor.isActive('heading', { level: 1 })}>
            H1
          </ToolbarButton>
          <ToolbarButton onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()} active={editor.isActive('heading', { level: 2 })}>
            H2
          </ToolbarButton>
          <ToolbarButton onClick={() => editor.chain().focus().toggleHeading({ level: 3 }).run()} active={editor.isActive('heading', { level: 3 })}>
            H3
          </ToolbarButton>

          <div className="w-px h-5 bg-gray-300 mx-1" />

          <ToolbarButton onClick={() => editor.chain().focus().toggleBulletList().run()} active={editor.isActive('bulletList')}>
            • List
          </ToolbarButton>
          <ToolbarButton onClick={() => editor.chain().focus().toggleOrderedList().run()} active={editor.isActive('orderedList')}>
            1. List
          </ToolbarButton>
          <ToolbarButton onClick={() => editor.chain().focus().toggleBlockquote().run()} active={editor.isActive('blockquote')}>
            ❝
          </ToolbarButton>

          <div className="w-px h-5 bg-gray-300 mx-1" />

          <ToolbarButton onClick={() => editor.chain().focus().undo().run()}>↩</ToolbarButton>
          <ToolbarButton onClick={() => editor.chain().focus().redo().run()}>↪</ToolbarButton>
        </div>
      )}

      {/* Title inside editor */}
      <div className="px-6 pt-6 pb-2 border-b border-gray-100">
        <input
          type="text"
          value={title || ''}
          onChange={(e) => onTitleChange?.(e.target.value)}
          readOnly={!editable}
          placeholder="Article title..."
          className="w-full text-2xl font-bold text-slate-800 border-none outline-none bg-transparent placeholder-gray-300"
        />
      </div>

      {/* Editor Area */}
      <EditorContent
        editor={editor}
        className="prose prose-slate prose-sm max-w-none p-6 min-h-64 focus:outline-none text-slate-700 [&_.ProseMirror]:outline-none [&_.ProseMirror]:font-sans"
      />
    </div>
  )
}