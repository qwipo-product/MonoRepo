{
  description = "mockups-lab — product-team frontend mockups. Bun toolchain pinned via Nix.";

  # One input: nixpkgs, tracking nixpkgs-unstable so it shares a binary cache
  # with the other Qwipo repos (seller-platform et al) and `bun` is usually
  # already on disk. The exact revision is pinned in flake.lock — bump it
  # deliberately with `nix flake update`.
  inputs.nixpkgs.url = "github:nixos/nixpkgs/nixpkgs-unstable";

  outputs = { self, nixpkgs }:
    let
      systems = [ "aarch64-darwin" "x86_64-darwin" "aarch64-linux" "x86_64-linux" ];
      # genAttrs is lazy — only the current system is ever evaluated.
      forAllSystems = f:
        nixpkgs.lib.genAttrs systems (system: f nixpkgs.legacyPackages.${system});
    in
    {
      devShells = forAllSystems (pkgs: {
        default = pkgs.mkShell {
          # Nix owns the *runtime*. Everything else (turbo, vite, eslint,
          # typescript) is a devDependency that `bun install` drops into
          # node_modules — pinned by bun.lock, not duplicated here.
          packages = [
            pkgs.bun # matches "packageManager": "bun@1.3.13" in package.json

            # Not strictly required — bunfig.toml routes bin scripts through
            # Bun — but a few tools still shell out to a literal `node`, and a
            # product-team repo should not fail with "node: command not found".
            pkgs.nodejs_22
          ];

          # stderr, so it never pollutes direnv's env capture.
          shellHook = ''
            echo "🧪 mockups-lab → bun $(bun --version)  ·  run 'bun install' then 'bun dev'" >&2
          '';
        };
      });
    };
}
