import { MenuItem, Stack, Typography } from "@mui/material";
import { DetectionObjectTypeCategory } from "coram-common-utils";
import { StyledSelect } from "components/styled_components/StyledSelect";

interface ObjectCategoriesSelectorProps {
  selectedObjectCategories: DetectionObjectTypeCategory[];
  setSelectedObjectCategories: (
    objectCategories: DetectionObjectTypeCategory[]
  ) => void;
  objectCategories?: DetectionObjectTypeCategory[];
}

// Ashesh asked to remove the multi-select for now and ignore ANIMAL.
// We can add it back later if needed. At the moment it's managed with FE transformation.
export function ObjectCategoriesSelector({
  selectedObjectCategories,
  setSelectedObjectCategories,
  objectCategories = [
    DetectionObjectTypeCategory.VEHICLE,
    DetectionObjectTypeCategory.PERSON,
    DetectionObjectTypeCategory.MOTION,
  ],
}: ObjectCategoriesSelectorProps) {
  return (
    <Stack gap={1}>
      <Typography variant="body1" color="#83889E">
        Object Types
      </Typography>
      <StyledSelect
        fullWidth
        displayEmpty={true}
        value={
          selectedObjectCategories.length > 0
            ? selectedObjectCategories[0]
            : undefined
        }
        onChange={(event) => {
          const selectedValues = event.target.value as string;
          const selectedObjectCategories = Object.values(
            DetectionObjectTypeCategory
          ).filter((category) => selectedValues === category);
          setSelectedObjectCategories(selectedObjectCategories);
        }}
        renderValue={() => {
          if (selectedObjectCategories.length === 0) {
            return "Click to select Object Categories";
          }
          return selectedObjectCategories[0];
        }}
        inputProps={{ sx: { textTransform: "capitalize" } }}
      >
        {objectCategories.map((category) => (
          <MenuItem
            key={category}
            value={category}
            sx={{ textTransform: "capitalize" }}
          >
            {category}
          </MenuItem>
        ))}
      </StyledSelect>
    </Stack>
  );
}
