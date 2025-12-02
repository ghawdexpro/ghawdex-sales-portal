import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

// Analytics endpoint for wizard session data
// Provides drop-off analysis, conversion rates, and session insights

// Lazy initialization to avoid build-time errors
function getSupabase() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );
}

const STEP_NAMES: Record<number, string> = {
  1: 'Location',
  2: 'Consumption',
  3: 'System Selection',
  4: 'Financing',
  5: 'Contact',
  6: 'Summary',
};

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const days = parseInt(searchParams.get('days') || '7');
    const detailed = searchParams.get('detailed') === 'true';

    const startDate = new Date(Date.now() - days * 24 * 60 * 60 * 1000).toISOString();
    const supabase = getSupabase();

    // Get all sessions in the date range
    const { data: sessions, error } = await supabase
      .from('wizard_sessions')
      .select(`
        id, status, current_step, highest_step_reached,
        address, location, selected_system, system_size_kw,
        with_battery, battery_size_kwh, total_price,
        payment_method, created_at, last_activity_at,
        device_info, utm_source, utm_medium, utm_campaign,
        is_prefilled_lead, converted_lead_id
      `)
      .gte('created_at', startDate)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Failed to fetch sessions:', error);
      return NextResponse.json({ error: 'Database error' }, { status: 500 });
    }

    if (!sessions || sessions.length === 0) {
      return NextResponse.json({
        summary: {
          total_sessions: 0,
          period_days: days,
          conversion_rate: 0,
        },
        dropoff: [],
        funnel: [],
      });
    }

    // Calculate summary stats
    const total = sessions.length;
    const converted = sessions.filter(s => s.status === 'converted_to_lead').length;
    const abandoned = sessions.filter(s => s.status === 'abandoned').length;
    const inProgress = sessions.filter(s => s.status === 'in_progress').length;
    const completed = sessions.filter(s => s.status === 'completed').length;

    // Calculate funnel (how many reached each step)
    const funnelData: Array<{
      step: number;
      step_name: string;
      reached: number;
      percentage: number;
      dropoff_count: number;
      dropoff_rate: number;
    }> = [];

    for (let step = 1; step <= 6; step++) {
      const reached = sessions.filter(s => s.highest_step_reached >= step).length;
      const stoppedHere = sessions.filter(s =>
        s.highest_step_reached === step &&
        (s.status === 'abandoned' || s.status === 'in_progress')
      ).length;

      funnelData.push({
        step,
        step_name: STEP_NAMES[step],
        reached,
        percentage: total > 0 ? Math.round((reached / total) * 100) : 0,
        dropoff_count: stoppedHere,
        dropoff_rate: reached > 0 ? Math.round((stoppedHere / reached) * 100) : 0,
      });
    }

    // Calculate average duration and session length
    const sessionsWithDuration = sessions.filter(s =>
      s.last_activity_at && s.created_at
    );
    const avgDurationMinutes = sessionsWithDuration.length > 0
      ? Math.round(
          sessionsWithDuration.reduce((sum, s) => {
            const duration = new Date(s.last_activity_at).getTime() - new Date(s.created_at).getTime();
            return sum + duration;
          }, 0) / sessionsWithDuration.length / 1000 / 60
        )
      : 0;

    // Device breakdown
    const mobileCount = sessions.filter(s =>
      s.device_info && typeof s.device_info === 'object' && (s.device_info as { isMobile?: boolean }).isMobile
    ).length;

    // System popularity for abandoned sessions (what were people interested in?)
    const abandonedWithSystem = sessions.filter(s =>
      s.status === 'abandoned' && s.selected_system
    );
    const systemInterest: Record<string, number> = {};
    abandonedWithSystem.forEach(s => {
      const sys = s.selected_system as string;
      systemInterest[sys] = (systemInterest[sys] || 0) + 1;
    });

    // Location breakdown
    const maltaCount = sessions.filter(s => s.location === 'malta').length;
    const gozoCount = sessions.filter(s => s.location === 'gozo').length;

    // UTM source breakdown (for marketing attribution)
    const sourceBreakdown: Record<string, number> = {};
    sessions.forEach(s => {
      const source = (s.utm_source as string) || 'direct';
      sourceBreakdown[source] = (sourceBreakdown[source] || 0) + 1;
    });

    // Response
    const response: {
      summary: {
        total_sessions: number;
        period_days: number;
        converted: number;
        abandoned: number;
        in_progress: number;
        completed: number;
        conversion_rate: number;
        avg_duration_minutes: number;
      };
      funnel: typeof funnelData;
      insights: {
        mobile_percentage: number;
        malta_percentage: number;
        gozo_percentage: number;
        prefilled_percentage: number;
        battery_interest_rate: number;
      };
      popular_systems_abandoned: Record<string, number>;
      traffic_sources: Record<string, number>;
      abandoned_sessions?: Array<{
        id: string;
        highest_step: number;
        step_name: string;
        address: string | null;
        system: string | null;
        price: number | null;
        created_at: string;
      }>;
    } = {
      summary: {
        total_sessions: total,
        period_days: days,
        converted,
        abandoned,
        in_progress: inProgress,
        completed,
        conversion_rate: total > 0 ? Math.round((converted / total) * 100) : 0,
        avg_duration_minutes: avgDurationMinutes,
      },
      funnel: funnelData,
      insights: {
        mobile_percentage: total > 0 ? Math.round((mobileCount / total) * 100) : 0,
        malta_percentage: total > 0 ? Math.round((maltaCount / total) * 100) : 0,
        gozo_percentage: total > 0 ? Math.round((gozoCount / total) * 100) : 0,
        prefilled_percentage: total > 0
          ? Math.round((sessions.filter(s => s.is_prefilled_lead).length / total) * 100)
          : 0,
        battery_interest_rate: total > 0
          ? Math.round((sessions.filter(s => s.with_battery).length / total) * 100)
          : 0,
      },
      popular_systems_abandoned: systemInterest,
      traffic_sources: sourceBreakdown,
    };

    // Include detailed session list if requested
    if (detailed) {
      response.abandoned_sessions = sessions
        .filter(s => s.status === 'abandoned' && s.highest_step_reached >= 2)
        .slice(0, 50)
        .map(s => ({
          id: s.id,
          highest_step: s.highest_step_reached,
          step_name: STEP_NAMES[s.highest_step_reached],
          address: s.address,
          system: s.selected_system,
          price: s.total_price,
          created_at: s.created_at,
        }));
    }

    return NextResponse.json(response);
  } catch (error) {
    console.error('Analytics error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
