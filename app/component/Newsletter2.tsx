

"use client";

import { Badge } from "@/components/ui/badge";
import { Button, buttonVariants } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { VariantProps } from "class-variance-authority";
import React, { ReactNode, useState } from "react";

type ButtonVariant = VariantProps<typeof buttonVariants>["variant"];

type ButtonProps = {
  text?: string;
  className?: string;
  variant?: ButtonVariant;
};

type BaseInputProps = {
  placeholder?: string;
  className?: string;
  caption?: string;
};

type ControlledInputProps = BaseInputProps & {
  onSubmit: (email: string) => void;
  value: string;
  setValue: (email: string) => void;
};

type UncontrolledInputProps = BaseInputProps & {
  onSubmit?: never;
  value?: never;
  setValue?: never;
};

type InputProps = ControlledInputProps | UncontrolledInputProps;

interface Newsletter1Props {
  sectionId?: string;
  heading?: { text?: string | ReactNode; className?: string };
  subheading?: { text?: string; className?: string };
  button?: ButtonProps;
  featureBadge?: { shortText?: string; longText?: string; className?: string };
  inputElement?: InputProps;
}

export default function Newsletter2({
  sectionId = "",
  heading,
  subheading,
  button,
  featureBadge,
  inputElement,
}: Newsletter1Props) {
  const {
    shortText: badgeText = "Join",
    longText = "  Start collaboration project",
    className: badgeClassName = "",
  } = featureBadge || {};

  const {
    text: titleText = "Smarter Way to Manage Your Projects",
    className: titleClassName = "",
  } = heading || {};

  const {
    text: descriptionText = "Streamline collaboration, track progress, and hit every deadline—effortlessly.",
    className: descriptionClassName = "",
  } = subheading || {};

  const {
    text: buttonText = "Subscribe",
    className: buttonClassName = "",
    variant: variantButton = "default",
  } = button || {};

  const {
    className = "",
    onSubmit,
    placeholder = "Your email",
    value,
    setValue,
    caption = "",
  } = inputElement || {};

  const [email, setEmail] = useState("");

  const isEmailInputControlled = value !== undefined && setValue !== undefined;

  const currentValue = isEmailInputControlled ? value : email;
  const setCurrentValue = isEmailInputControlled ? setValue : setEmail;

  const handleSubmit = () => {
    if (onSubmit) {
      onSubmit(currentValue);
    }
    setCurrentValue("");
  };

  return (
    <section
      id={sectionId}
      className="w-full   py-20  flex items-center justify-center"
    >
      <div className="  p-16 px-14  max-lg:mx-8 max-md:mx-0 rounded-3xl max-md:rounded-none   text-center bg-primary/10 ">
        <div className="space-y-8">
          {/* Badge */}
          <div className="flex border-primary dark:bg-neutral-900 justify-center items-center border py-[7px] mx-auto w-fit px-3 bg-white rounded-full">
            <Badge
              className={`bg-primary max-sm:hidden text-[13px] text-primary-foreground px-4 py-[3px]  shadow-none rounded-full  font-medium ${badgeClassName}`}
            >
              {badgeText}
            </Badge>
            <span className="ml-3 mr-1 text-primary">{longText}</span>
          </div>

          {/* Heading */}
          <div className="space-y-4">
            {typeof titleText !== "string" ? (
              <div>{titleText}</div>
            ) : (
              <h1
                className={`text-5xl md:text-6xl font-bold max-w-5xl   leading-tight ${titleClassName}`}
              >
                {titleText}
              </h1>
            )}

            <p
              className={`text-xl text-gray-600 max-w-3xl mx-auto ${descriptionClassName}`}
            >
              {descriptionText}
            </p>
          </div>

          {/* Email Form */}
          <div className="flex justify-center">
            <div className="w-full max-w-md relative">
              <Input
                type="email"
                placeholder={placeholder}
                className={`w-full pl-6 pr-32 py-4 dark:text-white shadow-none border h-16 border-none rounded-full bg-white dark:bg-neutral-900 text-gray-900 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent ${className}`}
                value={currentValue}
                onChange={(e) => setCurrentValue(e.target.value)}
              />
              <Button
                onClick={handleSubmit}
                variant={variantButton}
                className={`absolute right-[10px] top-1/2 transform -translate-y-1/2 px-6 py-2 shadow-none h-11 rounded-full bg-primary  text-primary-foreground ${buttonClassName}`}
              >
                {buttonText}
              </Button>
            </div>
          </div>

          {caption && <p className="text-sm opacity-50 mt-4">{caption}</p>}
        </div>
      </div>
    </section>
  );
}


