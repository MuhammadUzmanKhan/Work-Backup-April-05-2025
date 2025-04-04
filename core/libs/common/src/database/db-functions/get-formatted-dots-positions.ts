export const getFormattedDotsPositions = `CREATE OR REPLACE FUNCTION getFormattedDotsByPosition(json_input JSONB)
RETURNS JSONB AS $$
DECLARE
    result JSONB;
BEGIN
    -- Step 1: Flatten the JSON input
    WITH flattened_data AS (
        SELECT 
           dot_element->'vendor'->>'name' AS vendor_name,
            (dot_element->'vendor'->>'id')::int AS vendor_id,
            dot_element->'vendor'->>'color' AS vendor_color,
            dot_element->'position'->>'name' AS position_name,
            (dot_element->'position'->>'id')::int AS position_id,
            dot_element->>'placed' = 'true' AS is_placed,  -- Extract the placed attribute
            dot_element AS dot_data
        FROM jsonb_array_elements(json_input) AS dot_element
    ),
    
    -- Step 2: Aggregate dots under positions
    positions_aggregated AS (
        SELECT 
            vendor_name,
            vendor_id,
            vendor_color,
            position_name,
            position_id,
            jsonb_agg(dot_data) AS dots,
            COUNT(*) AS total_position_dots,  -- Count the number of dots per position
            COUNT(*) FILTER (WHERE is_placed) AS placed_position_dots  -- Count the placed dots per position
        FROM flattened_data
        GROUP BY vendor_name, vendor_id, vendor_color, position_name, position_id
    ),
    
    -- Step 3: Aggregate positions under vendors, including the total dots count per vendor
    final_aggregation AS (
        SELECT 
            vendor_name,
            vendor_id,
            vendor_color,
            jsonb_agg(
                jsonb_build_object(
                    'id', position_id,
                    'name', position_name,
                    'dots', dots,
                    'total_dots', total_position_dots,  -- Include the total dots count per position
                    'placed_dots', placed_position_dots  -- Include the placed dots count per position
                )
            ) AS positions,
            SUM(total_position_dots) AS total_vendor_dots,  -- Sum the total dots for the vendor
            SUM(placed_position_dots) AS placed_vendor_dots  -- Sum the placed dots for the area
        FROM positions_aggregated
        GROUP BY vendor_name, vendor_id, vendor_color
    )
    
    -- Final Step: Aggregate everything into the final JSON structure
    SELECT jsonb_agg(
        jsonb_build_object(
            'id', vendor_id,
            'name', vendor_name,
            'color', vendor_color,
            'positions', positions,
            'total_dots', total_vendor_dots,  -- Include the total dots count per vendor
            'placed_dots', placed_vendor_dots  -- Include the placed dots count per vendor
        )
    ) INTO result
    FROM final_aggregation;

    RETURN result;
END;
$$ LANGUAGE plpgsql;
`;
