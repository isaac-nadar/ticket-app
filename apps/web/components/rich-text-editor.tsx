"use client";

import { useEditor, EditorContent, ReactRenderer } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import Mention from "@tiptap/extension-mention";
import { SuggestionProps, SuggestionKeyDownProps } from "@tiptap/suggestion";
import tippy, { Instance as TippyInstance } from "tippy.js";
import "tippy.js/dist/tippy.css";
import {
  Bold,
  Italic,
  Strikethrough,
  Code,
  List,
  ListOrdered,
} from "lucide-react";
import { forwardRef, useImperativeHandle, useState } from "react";
import { Button } from "@/components/ui/button";

// ==========================================
// 1. STRICT TYPES
// ==========================================
export interface MentionItem {
  id: string;
  name: string;
}

interface MentionListProps {
  items: MentionItem[];
  command: (props: { id: string; label: string }) => void;
}

// What the MentionList exposes to the parent Tippy container
export interface MentionListRef {
  onKeyDown: (props: SuggestionKeyDownProps) => boolean;
}

interface RichTextEditorProps {
  content: string;
  onChange: (content: string) => void;
  users: MentionItem[];
}

// ==========================================
// 2. THE MENTION DROPDOWN UI
// ==========================================
const MentionList = forwardRef<MentionListRef, MentionListProps>(
  (props, ref) => {
    const [selectedIndex, setSelectedIndex] = useState(0);

    const selectItem = (index: number) => {
      const item = props.items[index];
      if (item) {
        props.command({ id: item.id, label: item.name });
      }
    };

    useImperativeHandle(ref, () => ({
      onKeyDown: ({ event }: SuggestionKeyDownProps) => {
        if (event.key === "ArrowUp") {
          setSelectedIndex(
            (prev) => (prev + props.items.length - 1) % props.items.length,
          );
          return true;
        }
        if (event.key === "ArrowDown") {
          setSelectedIndex((prev) => (prev + 1) % props.items.length);
          return true;
        }
        if (event.key === "Enter") {
          selectItem(selectedIndex);
          return true;
        }
        return false;
      },
    }));

    return (
      <div className="bg-popover text-popover-foreground shadow-md rounded-md border p-1 overflow-hidden min-w-[150px]">
        {props.items.length ? (
          props.items.map((item, index) => (
            <button
              className={`flex w-full items-center gap-2 rounded-sm px-2 py-1.5 text-sm transition-colors ${
                index === selectedIndex
                  ? "bg-accent text-accent-foreground"
                  : "hover:bg-accent/50"
              }`}
              key={item.id}
              onClick={() => selectItem(index)}
            >
              {item.name}
            </button>
          ))
        ) : (
          <div className="px-2 py-1.5 text-sm text-muted-foreground">
            No users found
          </div>
        )}
      </div>
    );
  },
);
MentionList.displayName = "MentionList";

// ==========================================
// 3. THE MAIN EDITOR COMPONENT
// ==========================================
export function RichTextEditor({
  content,
  onChange,
  users,
}: RichTextEditorProps) {
  const editor = useEditor({
    extensions: [
      StarterKit,
      Mention.configure({
        HTMLAttributes: {
          class:
            "bg-blue-100 text-blue-700 rounded px-1 font-medium dark:bg-blue-900 dark:text-blue-300",
        },
        suggestion: {
          items: ({ query }): MentionItem[] => {
            return users
              .filter((user) =>
                user.name.toLowerCase().startsWith(query.toLowerCase()),
              )
              .slice(0, 5);
          },
          render: () => {
            let component: ReactRenderer<MentionListRef>;
            let popup: TippyInstance[]; // Tippy returns an array of instances

            return {
              onStart: (props: SuggestionProps) => {
                component = new ReactRenderer(MentionList, {
                  props,
                  editor: props.editor,
                });

                if (!props.clientRect) return;

                popup = tippy("body", {
                  // Cast the DOMRect function properly for Tippy
                  getReferenceClientRect: props.clientRect as () => DOMRect,
                  appendTo: () => document.body,
                  content: component.element,
                  showOnCreate: true,
                  interactive: true,
                  trigger: "manual",
                  placement: "bottom-start",
                });
              },
              onUpdate(props: SuggestionProps) {
                component.updateProps(props);

                if (!props.clientRect) return;

                popup[0].setProps({
                  getReferenceClientRect: props.clientRect as () => DOMRect,
                });
              },
              onKeyDown(props: SuggestionKeyDownProps) {
                if (props.event.key === "Escape") {
                  popup[0].hide();
                  return true;
                }
                // Safely call the ref method if it exists
                return component?.ref?.onKeyDown(props) ?? false;
              },
              onExit() {
                popup[0]?.destroy();
                component?.destroy();
              },
            };
          },
        },
      }),
    ],
    content: content,
    onUpdate: ({ editor }) => {
      onChange(editor.getText());
    },
  });

  if (!editor) return null;

  return (
    <div className="flex flex-col gap-2 rounded-md border bg-card focus-within:ring-1 focus-within:ring-ring">
      {/* TOOLBAR */}
      <div className="flex flex-wrap items-center gap-1 border-b p-1 bg-muted/20">
        <Button
          variant="ghost"
          size="sm"
          className="h-8 w-8 p-0"
          onClick={() => editor.chain().focus().toggleBold().run()}
          data-active={editor.isActive("bold")}
        >
          <Bold className="h-4 w-4" />
        </Button>
        <Button
          variant="ghost"
          size="sm"
          className="h-8 w-8 p-0"
          onClick={() => editor.chain().focus().toggleItalic().run()}
          data-active={editor.isActive("italic")}
        >
          <Italic className="h-4 w-4" />
        </Button>
        <Button
          variant="ghost"
          size="sm"
          className="h-8 w-8 p-0"
          onClick={() => editor.chain().focus().toggleStrike().run()}
          data-active={editor.isActive("strike")}
        >
          <Strikethrough className="h-4 w-4" />
        </Button>
        <div className="w-px h-4 bg-border mx-1" />
        <Button
          variant="ghost"
          size="sm"
          className="h-8 w-8 p-0"
          onClick={() => editor.chain().focus().toggleBulletList().run()}
          data-active={editor.isActive("bulletList")}
        >
          <List className="h-4 w-4" />
        </Button>
        <Button
          variant="ghost"
          size="sm"
          className="h-8 w-8 p-0"
          onClick={() => editor.chain().focus().toggleOrderedList().run()}
          data-active={editor.isActive("orderedList")}
        >
          <ListOrdered className="h-4 w-4" />
        </Button>
        <div className="w-px h-4 bg-border mx-1" />
        <Button
          variant="ghost"
          size="sm"
          className="h-8 w-8 p-0"
          onClick={() => editor.chain().focus().toggleCodeBlock().run()}
          data-active={editor.isActive("codeBlock")}
        >
          <Code className="h-4 w-4" />
        </Button>
      </div>

      {/* EDITOR AREA */}
      <EditorContent
        editor={editor}
        className="prose prose-sm dark:prose-invert max-w-none p-3 min-h-[120px] focus:outline-none"
      />
    </div>
  );
}
