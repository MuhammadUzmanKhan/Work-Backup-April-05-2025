// This file exists to fix destructured imports in Flatten
// https://github.com/alexbol99/flatten-js/issues/98
import Flatten from "@flatten-js/core";

// eslint-disable-next-line import/no-named-as-default-member
const { point, segment, vector } = Flatten;

const FlattenPoint = point;
const FlattenSegment = segment;
const FlattenVector = vector;

export { FlattenPoint, FlattenSegment, FlattenVector };
