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
import { Flag, AlertCircle, CheckSquare } from "lucide-react";

import { useRouter, usePathname } from "next/navigation";

export function KanbanCard({
  card,
  boardPrefix,
}: {
  card: Card;
  boardPrefix: string | null;
}) {
  const router = useRouter();
  const pathname = usePathname();

  const displayId = `${boardPrefix || "CARD"}-${card.sequenceNum}`;

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

  const hasSubtasks = card.subtasks && card.subtasks.length > 0;
  let completedSubtasks = 0;

  if (hasSubtasks && card.subtasks) {
    // Assuming the right-most column is "Done" or check if column name includes "Done"
    // For simplicity, you can check if the subtask's column is the last column on the board,
    // or if you have a specific "Done" column ID.
    completedSubtasks = card.subtasks.filter(
      (st: Card) => st.column?.name === "Done",
    ).length;
  }

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
              <div className="flex items-center justify-between text-[10px] font-semibold tracking-wider text-muted-foreground">
                <span>{displayId}</span>

                {/* Render Priority Flags */}
                {card.priority === "URGENT" && (
                  <span className="flex items-center gap-1 text-red-600 bg-red-50 px-1.5 py-0.5 rounded">
                    <AlertCircle className="h-3 w-3" /> URGENT
                  </span>
                )}
                {card.priority === "HIGH" && (
                  <span className="text-orange-500" title="High Priority">
                    <Flag className="h-3 w-3 fill-orange-500" />
                  </span>
                )}
              </div>
              <p className="text-sm font-medium">{card.title}</p>
              {hasSubtasks && card.subtasks && (
                <div className="mt-1 flex items-center gap-1.5 text-xs font-medium text-muted-foreground">
                  <CheckSquare className="h-3.5 w-3.5" />
                  <div className="w-full max-w-[100px] h-1.5 bg-muted rounded-full overflow-hidden">
                    <div
                      className="h-full bg-blue-500 transition-all"
                      style={{
                        width: `${(completedSubtasks / card.subtasks.length) * 100}%`,
                      }}
                    />
                  </div>
                  <span className="text-[10px]">
                    {completedSubtasks}/{card.subtasks.length}
                  </span>
                </div>
              )}
              {card.description && (
                <p className="text-xs text-muted-foreground mt-2 line-clamp-2">
                  {card.description}
                </p>
              )}

              {card.tags && card.tags.length > 0 && (
                <div className="flex flex-wrap gap-1 mt-1">
                  {card.tags.map((tag: string) => (
                    <span
                      key={tag}
                      className="px-1.5 py-0.5 rounded text-[10px] font-medium bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400"
                    >
                      {tag}
                    </span>
                  ))}
                </div>
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
