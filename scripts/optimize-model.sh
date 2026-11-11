#!/bin/sh
# Turns a raw Onshape GLB export into a small, web-ready model.
# Usage: npm run model            (uses models-src/right-assembly.glb)
#        npm run model -- path/to/export.glb
#
# Each step reads the previous step's file and writes a new one, like stages in an ETL job.
set -e

IN="${1:-models-src/right-assembly.glb}"
OUT="public/models/clock.glb"
TMP="$(mktemp -d)"
T=./node_modules/.bin/gltf-transform

$T dedup   "$IN"        "$TMP/1.glb"                    # remove duplicated data
$T flatten "$TMP/1.glb" "$TMP/2.glb"                    # drop Onshape's "occurrence of" wrapper layers
$T join    "$TMP/2.glb" "$TMP/3.glb" --keepMeshes true  # merge each part's surface pieces into one, keeping part names
$T weld    "$TMP/3.glb" "$TMP/4.glb"                    # merge duplicate corner points
$T prune   "$TMP/4.glb" "$TMP/5.glb"                    # remove anything now unused
$T meshopt "$TMP/5.glb" "$OUT"                          # compress geometry for the web

rm -rf "$TMP"
echo "Wrote $OUT ($(du -h "$OUT" | cut -f1))"
