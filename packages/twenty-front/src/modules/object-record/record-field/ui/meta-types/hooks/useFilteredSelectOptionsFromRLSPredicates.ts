// Record-level predicate filtering shipped in the commercial module.
// Without it, every option stays visible and a nullable select can be cleared.
export const useFilteredSelectOptionsFromRLSPredicates = <TOption>({
  options,
}: {
  fieldMetadataId: string;
  objectMetadataNameSingular: string | undefined;
  options: TOption[];
}): { filteredOptions: TOption[]; canSelectEmpty: boolean } => ({
  filteredOptions: options,
  canSelectEmpty: true,
});
