# upload-to-storage.ps1
# Uploads all local reference assets to Supabase Storage using the Supabase CLI.
# Run from repo root: .\frontend\scripts\upload-to-storage.ps1
# Requires: supabase CLI linked to project (supabase link already done)

$ErrorActionPreference = "Continue"
$root = Split-Path -Parent (Split-Path -Parent $PSScriptRoot)
$publicRoot = Join-Path $root "frontend\public"

$uploads = @(
  # site-assets: home
  @{ local = "assets\reference\prada\home\hero\days-of-summer-loop.mp4";                        bucket = "site-assets"; path = "home/hero/days-of-summer-loop.mp4" },
  @{ local = "assets\reference\prada\home\mosaic\spring-summer-women-landscape.avif";            bucket = "site-assets"; path = "home/mosaic/spring-summer-women-landscape.avif" },
  @{ local = "assets\reference\prada\home\mosaic\spring-summer-men-landscape.avif";              bucket = "site-assets"; path = "home/mosaic/spring-summer-men-landscape.avif" },

  # site-assets: listing hero videos
  @{ local = "assets\reference\prada\women-new-arrivals\hero\new-arrivals-loop.webm";            bucket = "site-assets"; path = "women/new-arrivals/hero/new-arrivals-loop.webm" },
  @{ local = "assets\reference\prada\men-new-arrivals\hero\new-arrivals-loop.webm";              bucket = "site-assets"; path = "men/new-arrivals/hero/new-arrivals-loop.webm" },

  # site-assets: login editorial
  @{ local = "assets\reference\zara\login\editorial.jpg";                                        bucket = "site-assets"; path = "login/editorial/editorial.jpg" },

  # product-images: women new arrivals
  @{ local = "assets\reference\prada\women-new-arrivals\products\ribbed-cotton-top.avif";                                    bucket = "product-images"; path = "women/new-arrivals/ribbed-cotton-top.avif" },
  @{ local = "assets\reference\prada\women-new-arrivals\products\embroidered-linen-skirt.avif";                              bucket = "product-images"; path = "women/new-arrivals/embroidered-linen-skirt.avif" },
  @{ local = "assets\reference\prada\women-new-arrivals\products\antiqued-leather-sandals.avif";                             bucket = "product-images"; path = "women/new-arrivals/antiqued-leather-sandals.avif" },
  @{ local = "assets\reference\prada\women-new-arrivals\products\prada-fold-large-leather-shoulder-bag.avif";                bucket = "product-images"; path = "women/new-arrivals/prada-fold-large-leather-shoulder-bag.avif" },
  @{ local = "assets\reference\prada\women-new-arrivals\products\striped-pique-polo-shirt.avif";                             bucket = "product-images"; path = "women/new-arrivals/striped-pique-polo-shirt.avif" },
  @{ local = "assets\reference\prada\women-new-arrivals\products\prada-bonnie-small-printed-linen-leather-handbag.avif";     bucket = "product-images"; path = "women/new-arrivals/prada-bonnie-small-printed-linen-leather-handbag.avif" },
  @{ local = "assets\reference\prada\women-new-arrivals\products\shuffle-antiqued-leather-boat-shoes.avif";                  bucket = "product-images"; path = "women/new-arrivals/shuffle-antiqued-leather-boat-shoes.avif" },
  @{ local = "assets\reference\prada\women-new-arrivals\products\suede-jacket.avif";                                         bucket = "product-images"; path = "women/new-arrivals/suede-jacket.avif" },
  @{ local = "assets\reference\prada\women-new-arrivals\products\old-denim-blouson-jacket.avif";                             bucket = "product-images"; path = "women/new-arrivals/old-denim-blouson-jacket.avif" },

  # product-images: men new arrivals
  @{ local = "assets\reference\prada\men-new-arrivals\products\prada-route-canvas-leather-tote-bag.jpg";  bucket = "product-images"; path = "men/new-arrivals/prada-route-canvas-leather-tote-bag.jpg" },
  @{ local = "assets\reference\prada\men-new-arrivals\products\suede-bomber-jacket.jpg";                  bucket = "product-images"; path = "men/new-arrivals/suede-bomber-jacket.jpg" },
  @{ local = "assets\reference\prada\men-new-arrivals\products\sunglasses-iconic-metal-plaque.jpg";       bucket = "product-images"; path = "men/new-arrivals/sunglasses-iconic-metal-plaque.jpg" },
  @{ local = "assets\reference\prada\men-new-arrivals\products\leather-mules.jpg";                        bucket = "product-images"; path = "men/new-arrivals/leather-mules.jpg" },
  @{ local = "assets\reference\prada\men-new-arrivals\products\prada-explore-leather-shoulder-bag.jpg";   bucket = "product-images"; path = "men/new-arrivals/prada-explore-leather-shoulder-bag.jpg" },
  @{ local = "assets\reference\prada\men-new-arrivals\products\suede-band-sandals.jpg";                   bucket = "product-images"; path = "men/new-arrivals/suede-band-sandals.jpg" },
  @{ local = "assets\reference\prada\men-new-arrivals\products\striped-cotton-pique-polo-shirt.jpg";      bucket = "product-images"; path = "men/new-arrivals/striped-cotton-pique-polo-shirt.jpg" },
  @{ local = "assets\reference\prada\men-new-arrivals\products\old-denim-five-pocket-jeans.jpg";          bucket = "product-images"; path = "men/new-arrivals/old-denim-five-pocket-jeans.jpg" },
  @{ local = "assets\reference\prada\men-new-arrivals\products\bull-denim-zipper-shirt.jpg";              bucket = "product-images"; path = "men/new-arrivals/bull-denim-zipper-shirt.jpg" },

  # product-images: women dresses
  @{ local = "assets\reference\prada\women-categories\dresses\embroidered-linen-mini-dress.avif";  bucket = "product-images"; path = "women/dresses/embroidered-linen-mini-dress.avif" },
  @{ local = "assets\reference\prada\women-categories\dresses\embroidered-linen-dress.avif";       bucket = "product-images"; path = "women/dresses/embroidered-linen-dress.avif" },
  @{ local = "assets\reference\prada\women-categories\dresses\embroidered-canvas-mini-dress.avif"; bucket = "product-images"; path = "women/dresses/embroidered-canvas-mini-dress.avif" },

  # product-images: women tops
  @{ local = "assets\reference\prada\women-categories\tops\embroidered-linen-top.avif";           bucket = "product-images"; path = "women/tops/embroidered-linen-top.avif" },
  @{ local = "assets\reference\prada\women-categories\tops\linen-top-floral-motif.avif";          bucket = "product-images"; path = "women/tops/linen-top-floral-motif.avif" },
  @{ local = "assets\reference\prada\women-categories\tops\sleeveless-polka-dot-silk-shirt.avif"; bucket = "product-images"; path = "women/tops/sleeveless-polka-dot-silk-shirt.avif" },

  # product-images: women outerwear
  @{ local = "assets\reference\prada\women-categories\outerwear\embroidered-gabardine-blouson.avif"; bucket = "product-images"; path = "women/outerwear/embroidered-gabardine-blouson.avif" },
  @{ local = "assets\reference\prada\women-categories\outerwear\washed-re-nylon-jacket.avif";        bucket = "product-images"; path = "women/outerwear/washed-re-nylon-jacket.avif" },
  @{ local = "assets\reference\prada\women-categories\outerwear\silk-faille-blouson-jacket.avif";    bucket = "product-images"; path = "women/outerwear/silk-faille-blouson-jacket.avif" },

  # product-images: women trousers
  @{ local = "assets\reference\prada\women-categories\trousers\floral-print-linen-skirt.avif";  bucket = "product-images"; path = "women/trousers/floral-print-linen-skirt.avif" },
  @{ local = "assets\reference\prada\women-categories\trousers\pleated-silk-faille-skirt.avif"; bucket = "product-images"; path = "women/trousers/pleated-silk-faille-skirt.avif" },
  @{ local = "assets\reference\prada\women-categories\trousers\poplin-shorts.avif";             bucket = "product-images"; path = "women/trousers/poplin-shorts.avif" }
)

$ok = 0; $fail = 0

foreach ($item in $uploads) {
  $absPath = Join-Path $publicRoot $item.local
  if (-not (Test-Path $absPath)) {
    Write-Host "MISSING  $($item.local)" -ForegroundColor Yellow
    $fail++
    continue
  }
  $result = supabase storage cp $absPath "ss://$($item.bucket)/$($item.path)" 2>&1
  if ($LASTEXITCODE -eq 0) {
    Write-Host "OK       $($item.bucket)/$($item.path)" -ForegroundColor Green
    $ok++
  } else {
    Write-Host "FAIL     $($item.bucket)/$($item.path): $result" -ForegroundColor Red
    $fail++
  }
}

Write-Host ""
Write-Host "Done. ok=$ok fail=$fail"
