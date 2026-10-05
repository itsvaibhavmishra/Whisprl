import { InputSelectIcon } from '@/theme/overrides/CustomIcons';

export default function Select() {
  return {
    MuiSelect: {
      defaultProps: {
        IconComponent: InputSelectIcon,
      },
    },
  };
}
