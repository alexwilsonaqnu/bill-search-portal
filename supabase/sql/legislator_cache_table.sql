
-- Create a table for caching legislator information
CREATE TABLE IF NOT EXISTS public.legislator_cache (
    key TEXT NOT NULL PRIMARY KEY,
    data JSONB NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create index for faster lookups
CREATE INDEX IF NOT EXISTS legislator_cache_created_at_idx ON public.legislator_cache (created_at);

-- Add comment for documentation
COMMENT ON TABLE public.legislator_cache IS 'Persistent cache for OpenStates legislator data to reduce API calls';
