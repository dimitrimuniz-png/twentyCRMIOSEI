/* oxlint-disable twenty/no-hardcoded-colors -- IOSEI auth chrome is shown before the workspace theme exists. */
import './iosei-auth-fonts.css';

import { styled } from '@linaria/react';
import { doNotTranslate } from 'twenty-shared/i18n';

const ioseiTransition = doNotTranslate(
  'background-color 150ms ease-out, border-color 150ms ease-out, box-shadow 150ms ease-out, color 150ms ease-out',
);

export const StyledIoseiAuthPage = styled.div`
  align-items: center;
  background-color: #f3f4f9;
  background-image: radial-gradient(
    rgba(11, 16, 80, 0.07) 2px,
    transparent 2px
  );
  background-size: 32px 32px;
  box-sizing: border-box;
  display: flex;
  flex-direction: column;
  justify-content: center;
  /* The app scales with --t-zoom, so 100dvh would overflow the scaled viewport. */
  min-height: calc(100dvh / var(--t-zoom, 1));
  overflow-y: auto;
  padding: 64px 24px;
  width: 100%;
`;

export const StyledIoseiAuthCard = styled.div`
  align-items: center;
  background: #ffffff;
  border-radius: 24px;
  border-top: 6px solid #0b1050;
  box-shadow: 0 20px 60px rgba(11, 16, 80, 0.12);
  box-sizing: border-box;
  display: flex;
  flex-direction: column;
  gap: 20px;
  max-width: 440px;
  padding: 44px 40px 40px;
  width: 100%;

  @media (max-width: 359px) {
    padding: 44px 24px 40px;
  }
`;

export const StyledIoseiAuthLogoFrame = styled.div`
  background: transparent;
  border: 0;
  display: block;
  margin: 0 0 8px;
  padding: 0;
  width: 240px;

  img {
    display: block;
    height: auto;
    width: 100%;
  }
`;

export const StyledIoseiAuthLogoButton = styled.button`
  background: transparent;
  border: 0;
  cursor: pointer;
  display: block;
  margin: 0 0 8px;
  padding: 0;
  width: 240px;

  img {
    display: block;
    height: auto;
    width: 100%;
  }

  &:focus-visible {
    border-radius: 8px;
    box-shadow: 0 0 0 3px rgba(11, 16, 80, 0.15);
    outline: none;
  }
`;

export const StyledIoseiAuthDivider = styled.div`
  background: #e1e4ec;
  height: 1px;
  width: 100%;
`;

export const StyledIoseiAuthCopy = styled.div`
  display: flex;
  flex-direction: column;
  gap: 6px;
  text-align: center;
  width: 100%;
`;

export const StyledIoseiAuthTitle = styled.h1`
  color: #0b1050;
  font-family: 'Outfit', system-ui, sans-serif;
  font-size: 26px;
  font-weight: 600;
  line-height: 1.2;
  margin: 0;
  overflow-wrap: break-word;
`;

export const StyledIoseiAuthSubtitle = styled.p`
  color: #5a6078;
  font-family: 'Inter', system-ui, sans-serif;
  font-size: 14px;
  font-weight: 400;
  line-height: 1.5;
  margin: 0;
  overflow-wrap: break-word;
`;

export const StyledIoseiAuthBody = styled.div`
  display: flex;
  flex-direction: column;
  gap: 20px;
  min-width: 0;
  width: 100%;

  & > * {
    box-sizing: border-box;
    max-width: 100%;
  }
`;

export const StyledIoseiAuthFooter = styled.p`
  color: #5a6078;
  font-family: 'Inter', system-ui, sans-serif;
  font-size: 13px;
  font-weight: 400;
  margin: 28px 0 0;
  text-align: center;
`;

export const StyledIoseiAuthMethods = styled.div`
  display: flex;
  flex-direction: column;
  gap: 20px;
  width: 100%;
`;

export const StyledIoseiAuthForm = styled.form`
  display: flex;
  flex-direction: column;
  gap: 20px;
  width: 100%;
`;

export const StyledIoseiAuthField = styled.div`
  display: flex;
  flex-direction: column;
  min-width: 0;
  width: 100%;
`;

export const StyledIoseiAuthLabel = styled.label`
  color: #3a4060;
  font-family: 'Inter', system-ui, sans-serif;
  font-size: 13px;
  font-weight: 600;
  line-height: 1.3;
  margin-bottom: 8px;
`;

const ioseiControl = `
  background: #ffffff;
  border: 1.5px solid #d5d9e3;
  border-radius: 12px;
  box-sizing: border-box;
  transition: ${ioseiTransition};
  width: 100%;

  &:focus-visible,
  &:focus-within {
    border-color: #0b1050;
    box-shadow: 0 0 0 3px rgba(11, 16, 80, 0.15);
    outline: none;
  }

  &[data-invalid='true'] {
    border-color: #b42318;
  }

  &:disabled {
    background: #f7f8fb;
    cursor: not-allowed;
  }
`;

export const StyledIoseiAuthInput = styled.input`
  ${ioseiControl}
  color: #151833;
  font-family: 'Inter', system-ui, sans-serif;
  font-size: 15px;
  font-weight: 400;
  height: 48px;
  padding: 0 16px;

  &::placeholder {
    color: #7a8094;
  }

  &:disabled {
    color: #7a8094;
  }
`;

export const StyledIoseiAuthPasswordControl = styled.div`
  ${ioseiControl}
  align-items: center;
  display: flex;
  height: 48px;
  padding-left: 16px;
`;

export const StyledIoseiAuthPasswordInput = styled.input`
  background: transparent;
  border: 0;
  color: #151833;
  flex: 1;
  font-family: 'Inter', system-ui, sans-serif;
  font-size: 15px;
  font-weight: 400;
  height: 100%;
  min-width: 0;
  outline: none;
  padding: 0;

  &::placeholder {
    color: #7a8094;
  }

  &:disabled {
    color: #7a8094;
  }
`;

export const StyledIoseiAuthEyeButton = styled.button`
  align-items: center;
  background: transparent;
  border: 0;
  color: #5a6078;
  cursor: pointer;
  display: flex;
  flex: none;
  height: 46px;
  justify-content: center;
  padding: 0;
  width: 46px;

  &:focus-visible {
    border-radius: 8px;
    box-shadow: 0 0 0 3px rgba(11, 16, 80, 0.15);
    outline: none;
  }
`;

export const StyledIoseiAuthFieldMessage = styled.p`
  color: #b42318;
  font-family: 'Inter', system-ui, sans-serif;
  font-size: 13px;
  font-weight: 400;
  line-height: 1.4;
  margin: 6px 0 0;
`;

export const StyledIoseiAuthFieldHint = styled.p`
  color: #5a6078;
  font-family: 'Inter', system-ui, sans-serif;
  font-size: 13px;
  font-weight: 400;
  line-height: 1.4;
  margin: 6px 0 0;
`;

export const StyledIoseiAuthAlert = styled.p`
  color: #b42318;
  font-family: 'Inter', system-ui, sans-serif;
  font-size: 13px;
  font-weight: 400;
  line-height: 1.4;
  margin: 0;
  overflow-wrap: break-word;
  text-align: center;
`;

export const StyledIoseiAuthPrimaryButton = styled.button`
  background: #0b1050;
  border: 0;
  border-radius: 999px;
  color: #ffffff;
  cursor: pointer;
  font-family: 'Inter', system-ui, sans-serif;
  font-size: 16px;
  font-weight: 600;
  height: 52px;
  position: relative;
  transition: ${ioseiTransition};
  width: 100%;

  &:hover:not(:disabled) {
    background: #0a0e48;
  }

  &:active:not(:disabled) {
    background: #080b38;
  }

  &:focus-visible {
    box-shadow: 0 0 0 3px rgba(11, 16, 80, 0.15);
    outline: none;
  }

  &:disabled {
    cursor: not-allowed;
    opacity: 0.55;
  }
`;

export const StyledIoseiAuthButtonLabel = styled.span`
  &[data-loading='true'] {
    visibility: hidden;
  }
`;

export const StyledIoseiAuthSpinner = styled.span`
  animation: iosei-auth-spin 0.7s linear infinite;
  border: 2px solid rgba(255, 255, 255, 0.35);
  border-radius: 999px;
  border-top-color: #ffffff;
  height: 18px;
  left: 50%;
  margin-left: -9px;
  margin-top: -9px;
  position: absolute;
  top: 50%;
  width: 18px;
`;

export const StyledIoseiAuthSecondaryButton = styled.button`
  align-items: center;
  background: #ffffff;
  border: 1.5px solid #c9ceda;
  border-radius: 999px;
  color: #151833;
  cursor: pointer;
  display: flex;
  font-family: 'Inter', system-ui, sans-serif;
  font-size: 14px;
  font-weight: 600;
  gap: 10px;
  height: 48px;
  justify-content: center;
  transition: ${ioseiTransition};
  width: 100%;

  &:hover:not(:disabled) {
    background: #f7f8fb;
  }

  &:focus-visible {
    box-shadow: 0 0 0 3px rgba(11, 16, 80, 0.15);
    outline: none;
  }

  &:disabled {
    cursor: not-allowed;
    opacity: 0.55;
  }
`;

export const StyledIoseiAuthTextLink = styled.button`
  background: transparent;
  border: 0;
  color: #2b3f9e;
  cursor: pointer;
  font-family: 'Inter', system-ui, sans-serif;
  font-size: 14px;
  font-weight: 600;
  padding: 0;
  text-decoration: none;
  transition: ${ioseiTransition};

  &:hover {
    color: #0b1050;
  }

  &:focus-visible {
    border-radius: 4px;
    box-shadow: 0 0 0 3px rgba(11, 16, 80, 0.15);
    outline: none;
  }
`;

export const StyledIoseiAuthOrDivider = styled.div`
  align-items: center;
  color: #7a8094;
  display: flex;
  font-family: 'Inter', system-ui, sans-serif;
  font-size: 13px;
  font-weight: 400;
  gap: 12px;
  width: 100%;

  &::before,
  &::after {
    background: #e1e4ec;
    content: '';
    flex: 1;
    height: 1px;
  }
`;

export const StyledIoseiAuthRememberRow = styled.div`
  align-items: center;
  color: #4a5068;
  display: flex;
  flex-wrap: wrap;
  font-family: 'Inter', system-ui, sans-serif;
  font-size: 14px;
  font-weight: 400;
  gap: 12px;
  justify-content: space-between;
  width: 100%;
`;

export const StyledIoseiAuthRememberLabel = styled.label`
  align-items: center;
  cursor: pointer;
  display: flex;
  gap: 10px;
`;

export const StyledIoseiAuthCheckbox = styled.input`
  appearance: none;
  background-color: #ffffff;
  background-position: center;
  background-repeat: no-repeat;
  background-size: 18px 18px;
  border: 1.5px solid #9aa0b4;
  border-radius: 4px;
  box-sizing: border-box;
  cursor: pointer;
  flex: none;
  height: 18px;
  margin: 0;
  width: 18px;

  &:checked {
    background-color: #0b1050;
    background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 18 18'%3E%3Cpath d='M4 9.2 7.2 12.4 14 5.6' fill='none' stroke='white' stroke-width='1.8' stroke-linecap='round' stroke-linejoin='round'/%3E%3C/svg%3E");
    border-color: #0b1050;
  }

  &:focus-visible {
    box-shadow: 0 0 0 3px rgba(11, 16, 80, 0.15);
    outline: none;
  }
`;

export const StyledIoseiAuthCenteredLinkRow = styled.div`
  align-items: center;
  display: flex;
  flex-wrap: wrap;
  gap: 16px;
  justify-content: center;
  width: 100%;
`;

export const StyledIoseiAuthIconCircle = styled.div`
  align-items: center;
  background: rgba(11, 16, 80, 0.08);
  border-radius: 999px;
  color: #0b1050;
  display: flex;
  height: 64px;
  justify-content: center;
  margin: 0 auto;
  width: 64px;
`;

export const StyledIoseiAuthWaitBadge = styled.div`
  align-items: center;
  background: #eef0fa;
  border-radius: 999px;
  color: #0b1050;
  display: flex;
  height: 56px;
  justify-content: center;
  margin: 0 auto;
  width: 56px;
`;

export const StyledIoseiAuthWaitCopy = styled.p`
  color: #4a5068;
  font-family: 'Inter', system-ui, sans-serif;
  font-size: 14px;
  font-weight: 400;
  line-height: 1.5;
  margin: 0;
  overflow-wrap: break-word;
  text-align: center;
`;
