import { Injectable } from '@angular/core';
import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { Database } from '../models/database.model';

@Injectable({
  providedIn: 'root'
})
export class SupabaseService {
  public readonly client: SupabaseClient<Database>;

  constructor() {
    // These credentials were extracted from the provided React project files.
    // In a production app, these should be environment variables.
    const supabaseUrl = "https://ktqpncubqzlearesftal.supabase.co";
    const supabaseKey = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imt0cXBuY3VicXpsZWFyZXNmdGFsIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjIzMzgwMTcsImV4cCI6MjA3NzkxNDAxN30.LABPCYvYCPOwHs2eQuDl5rp44z-MDgBsq8G4LbDcBfc";

    this.client = createClient<Database>(supabaseUrl, supabaseKey);
  }
}
