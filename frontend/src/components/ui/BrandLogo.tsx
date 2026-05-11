import sparkBlackLogo from '../../logo/logo black spark with tagline.png';
import sparkWhiteLogo from '../../logo/logo white version.png';

type BrandLogoProps = {
  className?: string;
};

export function BrandLogo({ className }: BrandLogoProps) {
  return (
    <span className={className ? `brand-logo ${className}` : 'brand-logo'} aria-hidden="true">
      <img className="brand-logo-image brand-logo-image--dark" src={sparkBlackLogo} alt="" />
      <img className="brand-logo-image brand-logo-image--light" src={sparkWhiteLogo} alt="" />
    </span>
  );
}
