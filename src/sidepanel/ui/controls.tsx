// Form controls shared by the panel's tools. Presentational only.
import styled from 'styled-components';
import { Button } from './components';
import { color, radius } from './theme';

const controlStyle = `
  width: 100%;
  box-sizing: border-box;
  border: 1px solid ${color.control};
  border-radius: ${radius.control};
  padding: 8px 10px;
  font: inherit;
  color: ${color.ink};
  background: ${color.surface};
  &:focus {
    outline: 2px solid ${color.primary};
    outline-offset: 0;
    border-color: ${color.primary};
  }
  &[readonly] {
    background: ${color.canvas};
  }
`;

export const TextInput = styled.input`
  ${controlStyle}
  height: 36px;
`;

export const TextArea = styled.textarea`
  ${controlStyle}
  resize: vertical;
`;

export const Select = styled.select`
  ${controlStyle}
  height: 36px;
`;

export const Label = styled.label`
  display: flex;
  flex-direction: column;
  gap: 6px;
  font-weight: 600;
`;

export const Caption = styled.span`
  font-weight: 400;
  font-size: 12px;
  color: ${color.muted};
  line-height: 1.45;
`;

export const Row = styled.div`
  display: flex;
  gap: 8px;
  flex-wrap: wrap;
  align-items: center;
`;

export const SmallButton = styled(Button)`
  height: 30px;
  padding: 0 10px;
  font-size: 12px;
  &:disabled {
    opacity: 0.5;
    cursor: default;
  }
`;

export const PrimaryButton = styled(Button)`
  background: ${color.primary};
  border-color: ${color.primary};
  color: #ffffff;
  font-weight: 600;
  &:hover {
    background: ${color.brand};
  }
  &:disabled {
    opacity: 0.5;
    cursor: default;
  }
`;
