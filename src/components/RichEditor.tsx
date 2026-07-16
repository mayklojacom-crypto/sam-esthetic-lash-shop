import { useEditor, EditorContent } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import Image from '@tiptap/extension-image';
import Link from '@tiptap/extension-link';
import Youtube from '@tiptap/extension-youtube';
import Placeholder from '@tiptap/extension-placeholder';
import { useRef } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/hooks/use-toast';
import {
  Bold, Italic, Heading2, Heading3, List, ListOrdered, Quote,
  Link as LinkIcon, Image as ImageIcon, Youtube as YoutubeIcon, Undo, Redo
} from 'lucide-react';

interface Props {
  value: string;
  onChange: (html: string) => void;
  placeholder?: string;
}

const RichEditor = ({ value, onChange, placeholder }: Props) => {
  const fileRef = useRef<HTMLInputElement>(null);

  const editor = useEditor({
    extensions: [
      StarterKit,
      Image.configure({ HTMLAttributes: { class: 'rounded-lg my-3 max-w-full h-auto' } }),
      Link.configure({ openOnClick: false, HTMLAttributes: { class: 'text-primary underline' } }),
      Youtube.configure({ width: 640, height: 360, HTMLAttributes: { class: 'w-full aspect-video rounded-lg my-3' } }),
      Placeholder.configure({ placeholder: placeholder || 'Escreva o conteúdo...' }),
    ],
    content: value,
    onUpdate: ({ editor }) => onChange(editor.getHTML()),
    editorProps: {
      attributes: {
        class: 'prose prose-slate max-w-none focus:outline-none min-h-[300px] p-4',
      },
    },
  });

  if (!editor) return null;

  const uploadImage = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      const ext = file.name.split('.').pop();
      const name = `blog-${Date.now()}.${ext}`;
      const { error } = await supabase.storage.from('product-images').upload(name, file, { upsert: true });
      if (error) throw error;
      const { data } = supabase.storage.from('product-images').getPublicUrl(name);
      editor.chain().focus().setImage({ src: data.publicUrl }).run();
    } catch (err: any) {
      toast({ title: 'Erro no upload', description: err.message, variant: 'destructive' });
    } finally {
      if (fileRef.current) fileRef.current.value = '';
    }
  };

  const addLink = () => {
    const url = prompt('URL do link:');
    if (!url) return;
    editor.chain().focus().extendMarkRange('link').setLink({ href: url }).run();
  };

  const addYoutube = () => {
    const url = prompt('URL do vídeo do YouTube:');
    if (!url) return;
    editor.commands.setYoutubeVideo({ src: url });
  };

  const Btn = ({ onClick, active, children, title }: any) => (
    <button
      type="button"
      onClick={onClick}
      title={title}
      className={`p-2 rounded hover:bg-slate-100 ${active ? 'bg-slate-200 text-primary' : 'text-slate-700'}`}
    >
      {children}
    </button>
  );

  return (
    <div className="border border-slate-300 rounded-lg overflow-hidden bg-white">
      <div className="flex flex-wrap gap-0.5 p-1.5 border-b border-slate-200 bg-slate-50">
        <Btn onClick={() => editor.chain().focus().toggleBold().run()} active={editor.isActive('bold')} title="Negrito"><Bold size={16} /></Btn>
        <Btn onClick={() => editor.chain().focus().toggleItalic().run()} active={editor.isActive('italic')} title="Itálico"><Italic size={16} /></Btn>
        <div className="w-px bg-slate-300 mx-1" />
        <Btn onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()} active={editor.isActive('heading', { level: 2 })} title="Título"><Heading2 size={16} /></Btn>
        <Btn onClick={() => editor.chain().focus().toggleHeading({ level: 3 }).run()} active={editor.isActive('heading', { level: 3 })} title="Subtítulo"><Heading3 size={16} /></Btn>
        <div className="w-px bg-slate-300 mx-1" />
        <Btn onClick={() => editor.chain().focus().toggleBulletList().run()} active={editor.isActive('bulletList')} title="Lista"><List size={16} /></Btn>
        <Btn onClick={() => editor.chain().focus().toggleOrderedList().run()} active={editor.isActive('orderedList')} title="Lista numerada"><ListOrdered size={16} /></Btn>
        <Btn onClick={() => editor.chain().focus().toggleBlockquote().run()} active={editor.isActive('blockquote')} title="Citação"><Quote size={16} /></Btn>
        <div className="w-px bg-slate-300 mx-1" />
        <Btn onClick={addLink} active={editor.isActive('link')} title="Link"><LinkIcon size={16} /></Btn>
        <Btn onClick={() => fileRef.current?.click()} title="Imagem"><ImageIcon size={16} /></Btn>
        <Btn onClick={addYoutube} title="YouTube"><YoutubeIcon size={16} /></Btn>
        <div className="w-px bg-slate-300 mx-1" />
        <Btn onClick={() => editor.chain().focus().undo().run()} title="Desfazer"><Undo size={16} /></Btn>
        <Btn onClick={() => editor.chain().focus().redo().run()} title="Refazer"><Redo size={16} /></Btn>
      </div>
      <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={uploadImage} />
      <EditorContent editor={editor} />
    </div>
  );
};

export default RichEditor;
