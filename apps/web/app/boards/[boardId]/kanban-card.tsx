import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";

import {
  ContextMenu,
  ContextMenuContent,
  ContextMenuItem,
  ContextMenuSeparator,
  ContextMenuTrigger,
} from "@/components/ui/context-menu";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { CopyIcon, TrashIcon } from "lucide-react";
import { Card } from "@/domain/card/card.types";
import { UserAvatar } from "@/components/use-avatar";

import { useRouter, usePathname } from "next/navigation";

export function KanbanCard({ card }: { card: Card }) {
  const router = useRouter();
  const pathname = usePathname();

  const handleDuplicate = () => {
    console.log("Duplicating card:", card.id);
  };

  const handleDelete = () => {
    console.log("Deleting card:", card.id);
  };

  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({
    id: card.id,
    data: { type: "Card", card },
  });

  const handleCardClick = () => {
    // This safely adds ?card=uuid to the URL without reloading the page!
    router.push(`${pathname}?card=${card.id}`, { scroll: false });
  };

  const style = {
    transition,
    transform: CSS.Translate.toString(transform),
  };

  if (isDragging) {
    return (
      <div
        ref={setNodeRef}
        className="bg-muted/20 border-2 border-dashed border-border rounded-ui h-[100px] w-full opacity-60"
      />
    );
  }

  return (
    <>
      <ContextMenu>
        <ContextMenuTrigger asChild>
          <div
            ref={setNodeRef}
            style={style}
            onPointerDown={(e) => {
              // Only trigger click if it was a quick tap, not a long drag!
              // (dnd-kit listeners will handle the actual dragging)
            }}
            onClick={handleCardClick}
            className="bg-card text-card-foreground p-3 border border-ui border-border rounded-ui shadow-ui hover:shadow-ui-hover transition-all touch-none z-10 flex flex-col group"
          >
            {/* DRAG HANDLE */}
            <div
              {...listeners}
              {...attributes}
              className="h-4 w-full cursor-grab active:cursor-grabbing mb-2 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
            >
              <div className="w-8 h-1 bg-muted-foreground/30 rounded-full" />
            </div>

            {/* DIALOG TRIGGER */}
            {/* <DialogTrigger asChild> */}
            <div className="cursor-pointer text-left flex-1">
              <p className="text-sm font-medium">{card.title}</p>
              {card.description && (
                <p className="text-xs text-muted-foreground mt-2 line-clamp-2">
                  {card.description}
                </p>
              )}

              {/* CARD FOOTER */}
              <div className="flex items-center justify-between mt-auto pt-2">
                <div className="text-xs text-muted-foreground flex gap-2">
                  {/* Your Badges/Tags can go here */}
                  <span className="bg-muted px-2 py-0.5 rounded-sm">
                    {card.type}
                  </span>
                </div>

                {/* 👇 2. Render the Avatar! */}
                {card.assignee && (
                  <UserAvatar
                    user={card.assignee}
                    className="size-6 shadow-sm border-ui"
                  />
                )}
              </div>
            </div>
            {/* </DialogTrigger> */}
          </div>
        </ContextMenuTrigger>

        {/* Right-Click Menu Content */}
        <ContextMenuContent className="w-48">
          <ContextMenuItem
            onClick={handleDuplicate}
            className="cursor-pointer gap-2"
          >
            <CopyIcon className="w-4 h-4" />
            <span>Duplicate</span>
          </ContextMenuItem>

          <ContextMenuSeparator />

          {/* Use the destructive text color for delete! */}
          <ContextMenuItem
            onClick={handleDelete}
            className="cursor-pointer gap-2 text-destructive focus:text-destructive focus:bg-destructive/10"
          >
            <TrashIcon className="w-4 h-4" />
            <span>Delete</span>
          </ContextMenuItem>
        </ContextMenuContent>
      </ContextMenu>
    </>
  );

  // return (
  //   <Dialog>
  //     <ContextMenu>
  //       <ContextMenuTrigger asChild>
  //         <div
  //           ref={setNodeRef}
  //           style={style}
  //           onPointerDown={(e) => {
  //             // Only trigger click if it was a quick tap, not a long drag!
  //             // (dnd-kit listeners will handle the actual dragging)
  //           }}
  //           onClick={handleCardClick}
  //           className="bg-card text-card-foreground p-3 border border-ui border-border rounded-ui shadow-ui hover:shadow-ui-hover transition-all touch-none z-10 flex flex-col group"
  //         >
  //           {/* DRAG HANDLE */}
  //           <div
  //             {...listeners}
  //             {...attributes}
  //             className="h-4 w-full cursor-grab active:cursor-grabbing mb-2 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
  //           >
  //             <div className="w-8 h-1 bg-muted-foreground/30 rounded-full" />
  //           </div>

  //           {/* DIALOG TRIGGER */}
  //           <DialogTrigger asChild>
  //             <div className="cursor-pointer text-left flex-1">
  //               <p className="text-sm font-medium">{card.title}</p>
  //               {card.description && (
  //                 <p className="text-xs text-muted-foreground mt-2 line-clamp-2">
  //                   {card.description}
  //                 </p>
  //               )}

  //               {/* CARD FOOTER */}
  //               <div className="flex items-center justify-between mt-auto pt-2">
  //                 <div className="text-xs text-muted-foreground flex gap-2">
  //                   {/* Your Badges/Tags can go here */}
  //                   <span className="bg-muted px-2 py-0.5 rounded-sm">
  //                     {card.type}
  //                   </span>
  //                 </div>

  //                 {/* 👇 2. Render the Avatar! */}
  //                 {card.assignee && (
  //                   <UserAvatar
  //                     user={card.assignee}
  //                     className="size-6 shadow-sm border-ui"
  //                   />
  //                 )}
  //               </div>
  //             </div>
  //           </DialogTrigger>
  //         </div>
  //       </ContextMenuTrigger>

  //       {/* Right-Click Menu Content */}
  //       <ContextMenuContent className="w-48">
  //         <ContextMenuItem
  //           onClick={handleDuplicate}
  //           className="cursor-pointer gap-2"
  //         >
  //           <CopyIcon className="w-4 h-4" />
  //           <span>Duplicate</span>
  //         </ContextMenuItem>

  //         <ContextMenuSeparator />

  //         {/* Use the destructive text color for delete! */}
  //         <ContextMenuItem
  //           onClick={handleDelete}
  //           className="cursor-pointer gap-2 text-destructive focus:text-destructive focus:bg-destructive/10"
  //         >
  //           <TrashIcon className="w-4 h-4" />
  //           <span>Delete</span>
  //         </ContextMenuItem>
  //       </ContextMenuContent>
  //     </ContextMenu>

  //     {/* THE MODAL CONTENT */}
  //     <DialogContent>
  //       <DialogHeader>
  //         <DialogTitle>Edit Card</DialogTitle>
  //       </DialogHeader>

  //       <div className="flex flex-col gap-4 py-4">
  //         <div className="flex flex-col gap-2">
  //           <Label htmlFor="title">Title</Label>
  //           <Input id="title" defaultValue={card.title} />
  //         </div>

  //         <div className="flex flex-col gap-2">
  //           <Label htmlFor="description">Description</Label>
  //           <Textarea
  //             id="description"
  //             defaultValue={card.description}
  //             rows={4}
  //           />
  //         </div>
  //       </div>

  //       <div className="flex justify-end gap-2">
  //         <Button variant="outline">Cancel</Button>
  //         <Button>Save Changes</Button>
  //       </div>
  //     </DialogContent>
  //   </Dialog>
  // );
}
