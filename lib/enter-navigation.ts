"use client";

import type { FocusEvent, KeyboardEvent } from "react";

type SupportedField = HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement;
const SELECT_ENTER_OPENED_ATTR = "data-enter-opened";

function isSupportedField(target: EventTarget | null): target is SupportedField {
  return (
    target instanceof HTMLInputElement ||
    target instanceof HTMLSelectElement ||
    target instanceof HTMLTextAreaElement
  );
}

function isNavigableField(field: Element): field is SupportedField {
  if (
    !(field instanceof HTMLInputElement) &&
    !(field instanceof HTMLSelectElement) &&
    !(field instanceof HTMLTextAreaElement)
  ) {
    return false;
  }

  if (field instanceof HTMLInputElement) {
    if (
      [
        "hidden",
        "checkbox",
        "radio",
        "file",
        "submit",
        "reset",
        "button",
        "image",
      ].includes(field.type)
    ) {
      return false;
    }
  }

  return !field.disabled && field.tabIndex !== -1;
}

export function moveToNextFormField(event: KeyboardEvent<HTMLFormElement>) {
  if (
    event.key !== "Enter" ||
    event.shiftKey ||
    event.ctrlKey ||
    event.altKey ||
    event.metaKey
  ) {
    return;
  }

  if (!isSupportedField(event.target)) {
    return;
  }

  const currentField = event.target;
  if (currentField instanceof HTMLInputElement) {
    if (["checkbox", "radio", "file", "submit", "reset", "button", "image"].includes(currentField.type)) {
      return;
    }
  }

  if (currentField instanceof HTMLSelectElement) {
    const hasOpened = currentField.getAttribute(SELECT_ENTER_OPENED_ATTR) === "true";

    if (!hasOpened) {
      event.preventDefault();
      currentField.setAttribute(SELECT_ENTER_OPENED_ATTR, "true");
      try {
        currentField.showPicker?.();
      } catch {
        currentField.click();
      }
      return;
    }

    currentField.removeAttribute(SELECT_ENTER_OPENED_ATTR);
  }

  const form = currentField.form;
  if (!form) {
    return;
  }

  const fields = Array.from(form.querySelectorAll("input, select, textarea")).filter(
    isNavigableField,
  );
  const currentIndex = fields.indexOf(currentField);
  if (currentIndex === -1) {
    return;
  }

  const nextField = fields[currentIndex + 1];
  if (!nextField) {
    return;
  }

  event.preventDefault();
  nextField.focus();
  if (nextField instanceof HTMLInputElement || nextField instanceof HTMLTextAreaElement) {
    nextField.select?.();
  }
}

export function resetEnterNavigationState(event: FocusEvent<HTMLFormElement>) {
  const target = event.target;

  if (target instanceof HTMLSelectElement) {
    target.removeAttribute(SELECT_ENTER_OPENED_ATTR);
  }
}

export function focusFirstFormField(form: HTMLFormElement | null) {
  if (!form) {
    return;
  }

  const fields = Array.from(form.querySelectorAll("input, select, textarea")).filter(
    isNavigableField,
  );
  const firstField = fields[0];
  if (!firstField) {
    return;
  }

  firstField.focus();
  if (firstField instanceof HTMLInputElement || firstField instanceof HTMLTextAreaElement) {
    firstField.select?.();
  }
}

export function preventMouseOnlyUploadKeyboard(
  event: KeyboardEvent<HTMLButtonElement>,
) {
  if (event.key === "Enter" || event.key === " ") {
    event.preventDefault();
  }
}
