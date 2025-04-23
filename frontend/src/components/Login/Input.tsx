import React from "react";
import { TextField, Grid, InputAdornment, IconButton } from "@mui/material";
import Visibility from "@mui/icons-material/Visibility";
import VisibilityOff from "@mui/icons-material/VisibilityOff";

interface InputProps {
  name: string;
  label: string;
  value?: string;
  half?: boolean;
  autoFocus?: boolean;
  type?: string;
  passValue?: string;
  showBar?: boolean;
  handleChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  handleShowPassword?: () => void;
}

const Input: React.FC<InputProps> = ({
  name,
  value,
  handleChange,
  label,
  half,
  autoFocus,
  type,
  handleShowPassword,
}) => (
  <Grid item xs={12} sm={half ? 6 : 12}>
    <TextField
      name={name}
      onChange={handleChange}
      variant="outlined"
      required
      fullWidth
      label={label}
      autoFocus={autoFocus}
      type={type}
      value={value}
      InputProps={
        name === "password" || name === "oldPassword"
          ? {
              endAdornment: (
                <InputAdornment position="end">
                  <IconButton onClick={handleShowPassword}>
                    {type === "password" ? <Visibility /> : <VisibilityOff />}
                  </IconButton>
                </InputAdornment>
              ),
            }
          : undefined
      }
    />
  </Grid>
);

export default Input;