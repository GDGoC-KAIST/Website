
 
"use client";
/*

import { useCallback, useMemo, useState } from "react";

import { ContentCardProps, ContentCards, DropdownMenu } from "./content-cards";
import { MdDelete, MdEdit, MdShare, MdWorkHistory } from "react-icons/md";
import { BsThreeDots } from "react-icons/bs";

export default function Page() {
  const dropDownMenu: DropdownMenu = {
    trigger: <BsThreeDots />,
    items: [
      {
        icon: <MdEdit />,
        label: "Edit",
        onClick: (id: string) => handleThreeDotsClick(id),
      },

      {
        icon: <MdShare />,
        label: "Share",

        onClick: (id: string) => handleClickedShare(id),
      },
      {
        icon: <MdDelete />,
        label: "Delete",
        className: "text-red-600",
        separator: true,
        onClick: (id: string) => handleClickedShare(id),
      },
    ],
  };

  const allCards: ContentCardProps[] = [
    {
      id: crypto.randomUUID(),
      isFavorite: false,
      icon: MdWorkHistory,
      title: "My Travel Notes",
      date: new Date(),
      content: "Visited Paris and saw the Eiffel Tower. The food was amazing!",
      tags: ["Travel", "Europe"],
    },
    {
      id: crypto.randomUUID(),
      isFavorite: false,
      icon: MdWorkHistory,
      title: "Work Meeting",
      date: new Date(),
      content: "Discussed Q3 goals and project timelines.",
      tags: ["Work"],
    },
    {
      id: crypto.randomUUID(),
      isFavorite: false,
      icon: MdWorkHistory,
      title: "Work Meeting",
      date: new Date(),
      content: "Discussed Q3 goals and project timelines.",
      tags: ["Work"],
    },
  ];

  const [cards, setCards] = useState<ContentCardProps[]>(allCards);

  const handleFavoriteToggle = useCallback((id: string) => {
    setCards((prevCards) =>
      prevCards.map((card) =>
        card.id === id ? { ...card, isFavorite: !card.isFavorite } : card
      )
    );
  }, []);

  const handleThreeDotsClick = useCallback((id: string) => {
    console.log("Clicked notes", id);
  }, []);

  const handleTitleClick = useCallback((id: string) => {
    console.log("Title clicked for card:", id);
  }, []);

  const handleClickedShare = useCallback((id: string) => {
    console.log("Card shared:", id);
  }, []);

  const processedCards = useMemo(
    () =>
      cards.map((card) => ({
        ...card,
        dropdownMenu: dropDownMenu,
        onFavoriteClick: () => handleFavoriteToggle(card.id),
        onTitleClick: () => handleTitleClick(card.id),
      })),
    [cards, handleFavoriteToggle, handleTitleClick, handleThreeDotsClick]
  );

  return (
    <div>
      <ContentCards gridLayout={true} cards={processedCards} />
    </div>
  );
}*/


import {
  Card,
  CardHeader,
  CardTitle,
  CardContent,
  CardFooter,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import { BsThreeDots } from "react-icons/bs";
import {
  MdFavorite,
  MdPerson,
  MdTravelExplore,
  MdWorkspaces,
  MdWorkHistory,
} from "react-icons/md";
import { MdFavoriteBorder } from "react-icons/md";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import React, { ReactNode, useCallback, useMemo } from "react";

export interface DropdownMenu {
  trigger?: React.ReactNode;
  items: {
    className?: string;
    label: string;
    onClick: (id: SingleContentCardProps["id"]) => void;
    icon?: React.ReactNode;
    separator?: boolean;
  }[];
}

export interface SingleContentCardProps {
  id: string;
  icon: React.ReactNode;
  title: string;
  subTitle?: ReactNode;
  date?: Date;
  content?: ReactNode;
  tags?: string[];
  variant?: "default" | "compact";
  className?: string;
  onCardClick?: () => void;
  onMoreOptionsClick?: () => void;
  onTitleClicked?: (id: SingleContentCardProps["id"]) => void;
  footerContent?: React.ReactNode;
  onFavoriteClick?: () => void;
  isFavorite?: boolean;
  showContent?: boolean;
  showFooter?: boolean;
  classNameCard?: string;
  dropDownMenu?: DropdownMenu;
  hideDropDownButton?: boolean;
}

interface ContentCardsProps {
  cards?: Omit<SingleContentCardProps, "onCardClick">[];
  onCardClick?: (index: SingleContentCardProps["id"]) => void;
  className?: string;
  gridLayout?: boolean;
  showContent?: boolean;
  showFooter?: boolean;
  classNameCard?: string;
  dropDownMenu?: DropdownMenu;
  isLoading?: boolean;
  search?: string;
  setSearch?: (search: string) => void;
  noFoundCardText?: string;
  onTitleClicked?: (id: SingleContentCardProps["id"]) => void;
}

const DEFAULT_CARDS: SingleContentCardProps[] = [
  {
    id: crypto.randomUUID(),
    onTitleClicked: () => console.log("Title clicked"),
    isFavorite: false,
    onFavoriteClick: () => console.log("Favorite toggled"),
    icon: <MdTravelExplore/>,
    title: "My Travel Notes",
    date: new Date(),
    subTitle: <span>{new Date().toDateString()}</span>,
    content: (
      <p className="text-opacity-55 text-sm">
        {`Visited Paris and saw the Eiffel Tower. The food was amazing!`}
      </p>
    ),
    tags: ["Travel", "Europe"],
    variant: "default",
  },
  {
    id: crypto.randomUUID(),
    onTitleClicked: () => console.log("Title clicked"),
    isFavorite: false,
    onFavoriteClick: () => console.log("Favorite toggled"),
    icon: <MdWorkspaces/>,
    title: "Work Meeting",
    subTitle: <span>{new Date().toDateString()}</span>,
    date: new Date(),
    content: "Discussed Q3 goals and project timelines.",
    tags: ["Work"],
    variant: "default",
  },
  {
    id: crypto.randomUUID(),
    onTitleClicked: () => console.log("Title clicked"),
    isFavorite: false,
    onFavoriteClick: () => console.log("Favorite toggled"),
    icon: <MdPerson/>,
    title: "Personal Reflection",
    date: new Date(),
    subTitle: <span>{new Date().toDateString()}</span>,
    content:
      "Today I learned about React components and TypeScript interfaces.",
    tags: ["Learning", "Personal"],
    variant: "default",
  },
];

const DROP_DOWN_DEFAULT: DropdownMenu = {
  trigger: <BsThreeDots className="opacity-50" />,
  items: [
    { label: "Copy", onClick: () => {} },
    { label: "Delete", onClick: () => {} },
  ],
};

const ContentCardSkeleton = ({
  variant = "default",
}: {
  variant?: "default" | "compact";
}) => (
  <Card className={`${variant === "compact" ? "max-w-md" : "w-full"}`}>
    <CardHeader>
      <div className="flex items-start justify-between">
        <div className="flex items-center gap-3 flex-col w-full">
          {/* Icon Skeleton */}
          <Skeleton className="w-20 h-20 rounded-full bg-gray-200 dark:bg-gray-700" />

          {/* Title and Subtitle Skeletons */}
          <div className="text-center w-full space-y-2">
            <Skeleton className="h-6 w-3/4 mx-auto bg-gray-200 dark:bg-gray-700" />
            <Skeleton className="h-4 w-1/2 mx-auto bg-gray-200 dark:bg-gray-700" />
          </div>
        </div>

        {/* Dropdown Skeleton */}
        <Skeleton className="w-10 h-10 rounded-full bg-gray-200 dark:bg-gray-700" />
      </div>
    </CardHeader>

    {/* Content Skeleton */}
    <CardContent className="space-y-2">
      <Skeleton className="h-4 w-full bg-gray-200 dark:bg-gray-700" />
      <Skeleton className="h-4 w-5/6 bg-gray-200 dark:bg-gray-700" />
      <Skeleton className="h-4 w-4/6 bg-gray-200 dark:bg-gray-700" />
    </CardContent>

    {/* Footer Skeleton */}
    <CardFooter className="flex justify-between items-center">
      <div className="flex gap-2">
        <Skeleton className="h-6 w-16 rounded-full bg-gray-200 dark:bg-gray-700" />
        <Skeleton className="h-6 w-16 rounded-full bg-gray-200 dark:bg-gray-700" />
      </div>
      <Skeleton className="w-10 h-10 rounded-full bg-gray-200 dark:bg-gray-700" />
    </CardFooter>
  </Card>
);

const ContentCard = React.memo(function ContentCard({
  id,
  icon,
  title,
  subTitle,
  content,
  tags = [],
  variant = "default",
  onCardClick,
  onTitleClicked,
  onFavoriteClick = () => {},
  isFavorite = false,
  showContent,
  showFooter,
  classNameCard,
  dropDownMenu,
  footerContent,
  hideDropDownButton = false,
}: SingleContentCardProps) {
  const handleTitleClick = useCallback(
    (e: React.MouseEvent) => {
      e.stopPropagation();
      onTitleClicked?.(id);
    },
    [onTitleClicked, id]
  );

  return (
    <Card
      className={`${
        variant === "compact" ? "max-w-md" : "w-full"
      } ${classNameCard}`}
      onClick={onCardClick}
    >
      <CardHeader>
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-3 flex-col w-full ">
            <div className="w-16 h-16 rounded-full bg-primary/20 flex justify-center items-center text-primary">
              {icon ?? <MdWorkHistory size={28} />}
            </div>

            <div className="text-center">
              <CardTitle
                onClick={handleTitleClick}
                className="text-lg cursor-pointer hover:text-primary "
              >
                {title}
              </CardTitle>
              <div className="text-sm text-muted-foreground">
                {/* {format(date, "PPP")} */}
                {subTitle}
              </div>
            </div>
          </div>

          {/* Drop down section */}
          {dropDownMenu && !hideDropDownButton && (
            <>
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button
                    variant="ghost"
                    className="rounded-full w-10 h-10"
                    aria-label="More options"
                  >
                    {dropDownMenu.trigger}
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  {dropDownMenu.items.map((item, index) => (
                    <React.Fragment key={index}>
                      {item.separator && <DropdownMenuSeparator />}
                      <DropdownMenuItem
                        className={`h-10 ${item.className}`}
                        onClick={(e) => {
                          e.stopPropagation();
                          item.onClick(id);
                        }}
                      >
                        {item.icon && <span className="mr-2">{item.icon}</span>}
                        {item.label}
                      </DropdownMenuItem>
                    </React.Fragment>
                  ))}
                </DropdownMenuContent>
              </DropdownMenu>
            </>
          )}
        </div>
      </CardHeader>

      {showContent && (
        <CardContent className={variant === "compact" ? "line-clamp-3" : ""}>
          <>{content}</>
        </CardContent>
      )}

      {showFooter && (
        <CardFooter className=" ">
          <div className="flex justify-between items-center w-full ">
            <div className="flex flex-wrap gap-3">
              {tags.length > 0 ? (
                <>
                  {tags.map((tag, index) => (
                    <Badge key={index} variant="outline">
                      {tag}
                    </Badge>
                  ))}
                </>
              ) : (
                <span className="text-sm opacity-50">No Tags</span>
              )}
            </div>
            <Button
              onClick={onFavoriteClick}
              variant={"ghost"}
              className="rounded-full w-10"
            >
              {isFavorite ? (
                <MdFavorite className="opacity-50" />
              ) : (
                <MdFavoriteBorder className="opacity-50" />
              )}
            </Button>
          </div>
        </CardFooter>
      )}

      {footerContent && <CardFooter>{footerContent}</CardFooter>}
    </Card>
  );
});

export default function ContentCards1({
  cards = DEFAULT_CARDS,
  onCardClick,
  className = "",
  gridLayout = false,
  showContent = true,
  showFooter = true,
  classNameCard = "",
  dropDownMenu = DROP_DOWN_DEFAULT,
  isLoading = false,
  search,
  noFoundCardText = "No cards match your search",
  onTitleClicked,
}: ContentCardsProps) {
  // Filter cards based on search term
  const filteredCards = useMemo(() => {
    if (!search) return cards;

    const searchTerm = search.toLowerCase();

    return cards.filter((card) =>
      card.title.toLowerCase().includes(searchTerm)
    );
  }, [cards, search]);

  const skeletonCards = useMemo(
    () =>
      Array(3)
        .fill(0)
        .map((_, index) => (
          <ContentCardSkeleton
            key={`skeleton-${index}`}
            variant={cards[0]?.variant || "default"}
          />
        )),
    [cards]
  );

  const contentCards = useMemo(
    () =>
      filteredCards.map((card) => (
        <ContentCard
          key={card.id}
          {...card}
          showContent={showContent}
          showFooter={showFooter}
          classNameCard={classNameCard}
          dropDownMenu={dropDownMenu}
          onCardClick={onCardClick ? () => onCardClick(card.id) : undefined}
          onTitleClicked={onTitleClicked}
        />
      )),
    [
      filteredCards,
      onCardClick,
      showContent,
      showFooter,
      classNameCard,
      dropDownMenu,
      onTitleClicked,
    ]
  );

  return (
    <div
      className={`${
        gridLayout
          ? "grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4"
          : "space-y-4"
      } ${className}`}
    >
      {isLoading ? (
        skeletonCards
      ) : filteredCards.length > 0 ? (
        contentCards
      ) : (
        <div className="col-span-full text-center py-8 my-16">
          <p className="text-muted-foreground">{noFoundCardText}</p>
        </div>
      )}
    </div>
  );
}
