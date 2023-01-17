import React, { useState, useRef, useEffect } from "react";
import { createPortal } from "react-dom";
import styled from "styled-components";

const Overlay = styled.div`
  position: fixed;
  box-sizing: border-box;
  top: 0;
  left: 0;
  width: 100vw;
  height: 100vh;
  background: rgba(0, 0, 0, 0.85);
  z-index: 2000;
`;

const Container = styled.div`
  margin: 0 16px;
  position: absolute;
  top: 50%;
  left: calc(50% - 16px);
  transform: translate(-50%, -50%);
  max-width: 600px;
  width: calc(100% - 32px);
  border: 1px solid #efefef;
  border-radius: 8px;
  box-shadow: rgba(50, 50, 93, 0.07) 0px 5px 10px,
    rgba(0, 0, 0, 0.05) 0px 5px 5px;
  background: ${({ theme }) => theme.white};
  box-sizing: border-box;
  padding: 16px;

  > header {
    text-align: center;
    font-family: Montserrat;
    font-size: 20px;
    font-weight: 600;
    color: ${({ theme }) => theme.darkGrey};
    margin-bottom: 16px;
  }
  > p {
    text-align: center;
    color: ${({ theme }) => theme.grey};
    font-family: Open Sans;
    font-weight: 400;
    font-size: 16px;
    margin: 8px 0 20px;
  }
  > footer {
    margin-top: 16px;
    > button {
      float: right;
      margin-top: 8px;
      & + button {
        margin-right: 8px;
      }
    }
  }
`;

const Portal = ({ children, rootId }) => {
  const root = rootId ? document.getElementById(rootId) : document.body;
  return createPortal(children, root);
};

const stopPropagation = e => e.stopPropagation();
const callAll = (...fns) => (...args) => fns.forEach(fn => fn && fn(...args));

export type DialogDefaultProps = {
  dialogShow: Function,
  dialogHide: Function,
  dialogToggle: Function,
  onClick: Function,
  onKeyDown: Function,
  children: any,
};

export type DialogOptionalProps = {
  focusedElement?: React.ElementRef,
}

export const useDialog = () => {
  const [on, setOn] = useState(false);
  const show = () => setOn(true);
  const hide = () => setOn(false);
  const toggle = () => setOn(!on);

  const getDialogToggleProps = (props = {}) => ({
    ...props,
    onClick: callAll(props.onClick, toggle),
  });

  const getDialogProps: Function = (props = {}): DialogDefaultProps => ({
    ...props,
    dialogShow: show,
    dialogHide: hide,
    dialogToggle: toggle,
    onClick: callAll(props.onClick, toggle),
    onKeyDown: callAll(
      props.onKeyDown,
      ({ keyCode }) => keyCode === 27 && hide()
    ),
  });

  return {
    dialogOn: on,
    dialogShow: show,
    dialogHide: hide,
    dialogToggle: toggle,
    getDialogToggleProps,
    getDialogProps,
  };
};

export const Dialog = (props: DialogDefaultProps&DialogOptionalProps) => {
  const overlayEl = useRef(null);

  useEffect(() => {
    if (props.focusedElement) {
      props.focusedElement.current.focus();
    } else {
      overlayEl.current.focus();
    }
  });

  return (
    <Portal>
      <Overlay {...props} ref={overlayEl} aria-modal="true" tabIndex="-1">
        <Container onClick={stopPropagation}>{props.children}</Container>
      </Overlay>
    </Portal>
  );
};
