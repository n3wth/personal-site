#!/bin/bash
# Antigravity CLI skills installer. Optional skill IDs select a subset.
set -e
SKILLS_INSTALL_HOME="${SKILLS_INSTALL_HOME:-$HOME}"
SKILLS_REPO="https://github.com/n3wth/personal-site.git"
print_error() { printf '%s\n' "$1" >&2; }
print_success() { printf '%s\n' "$1"; }
print_warning() { printf '%s\n' "$1"; }

install_selected() {
    local target="$1"
    shift
    local temporary source skill entry assistant destination
    temporary=$(mktemp -d)
    trap 'rm -rf "$temporary"' EXIT
    git clone --depth 1 "$SKILLS_REPO" "$temporary" 2>/dev/null || {
        print_error "Failed to clone skills repository"
        exit 1
    }
    source="$temporary/apps/skills/skills"

    # Validate the entire selection before modifying any assistant directory.
    for skill in "$@"; do
        case "$skill" in
            ''|*[!a-z0-9-]*) print_error "Invalid skill ID: $skill"; exit 1 ;;
        esac
        if [ ! -f "$source/$skill.md" ] && [ ! -f "$source/$skill/SKILL.md" ]; then
            print_error "Skill is not available: $skill"
            exit 1
        fi
    done

    local targets="$target"
    if [ "$target" = all ]; then
        targets="gemini"
    fi
    for assistant in $targets; do
        destination="$SKILLS_INSTALL_HOME/.$assistant/skills"
        mkdir -p "$destination"
        for skill in "$@"; do
            if [ -f "$source/$skill.md" ]; then
                entry="$skill.md"
            else
                entry="$skill"
            fi
            if [ -e "$destination/$entry" ] || [ -L "$destination/$entry" ]; then
                print_warning "$assistant/$entry already exists, skipping"
            else
                cp -R "$source/$entry" "$destination/$entry"
                print_success "Installed $skill for $assistant"
            fi
        done
    done
    rm -rf "$temporary"
    trap - EXIT
}

TARGET="${1:-gemini}"
if [ "$#" -gt 0 ]; then shift; fi
case "$TARGET" in
    gemini|all) ;;
    *) print_error "Supported target: gemini"; exit 1 ;;
esac
if [ "$#" -gt 0 ]; then
    install_selected gemini "$@"
    exit 0
fi
temporary=$(mktemp -d)
trap 'rm -rf "$temporary"' EXIT
git clone --depth 1 "$SKILLS_REPO" "$temporary"
source="$temporary/apps/skills/skills"
[ -d "$source" ] || { print_error 'Skill source unavailable'; exit 1; }
destination="$SKILLS_INSTALL_HOME/.gemini/skills"
mkdir -p "$destination"
for entry in "$source"/*; do
    [ -e "$entry" ] || continue
    name=$(basename "$entry")
    if [ -e "$destination/$name" ] || [ -L "$destination/$name" ]; then
        print_warning "$name already exists, skipping"
    else
        cp -R "$entry" "$destination/$name"
    fi
done
print_success "Skills installed for Antigravity CLI"
