import PropTypes from 'prop-types';
import ThemeRtlLayout from '@/components/theme-settings/ThemeRtlLayout';
import ThemeColorPresets from '@/components/theme-settings/ThemeColorPresets';
import ThemeLocalization from '@/components/theme-settings/ThemeLocalization';

ThemeSettings.propTypes = {
  children: PropTypes.node.isRequired,
};

export default function ThemeSettings({ children }) {
  return (
    <ThemeColorPresets>
      <ThemeLocalization>
        <ThemeRtlLayout>{children}</ThemeRtlLayout>
      </ThemeLocalization>
    </ThemeColorPresets>
  );
}
