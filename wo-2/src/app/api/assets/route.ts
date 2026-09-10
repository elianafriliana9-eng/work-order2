import { NextRequest, NextResponse } from "next/server";
import { AssetService, AssetServiceError } from "@/services/asset-service";
import { ApiResponse } from "@/types/api";

function getActor(req: NextRequest) {
  const demoCookie = req.cookies.get("demo_user_role")?.value;
  const roleHeader = req.headers.get("x-user-role");
  const emailHeader = req.headers.get("x-user-email");
  const nameHeader = req.headers.get("x-user-name");

  if (roleHeader) {
    return {
      name: nameHeader || "Authenticated User",
      role: roleHeader,
      email: emailHeader || undefined,
    };
  }

  if (demoCookie === "head_it") {
    return {
      name: "Demo Head of IT",
      role: "head_it",
      email: "head.it@digitaltech.id",
    };
  }

  if (demoCookie === "user") {
    return {
      name: "Budi Santoso",
      role: "employee",
      email: "budi.santoso@digitaltech.id",
    };
  }

  // Default fallback for development/demo
  return {
    name: "Admin IT",
    role: "head_it",
    email: "admin@digitaltech.id",
  };
}

export async function GET(req: NextRequest) {
  try {
    const actor = getActor(req);
    const { searchParams } = new URL(req.url);

    const category = searchParams.get("category") || undefined;
    const status = searchParams.get("status") || undefined;
    const search = searchParams.get("search") || undefined;
    const page = parseInt(searchParams.get("page") || "1", 10);
    const limit = parseInt(searchParams.get("limit") || "20", 10);

    const result = await AssetService.listAssets({
      category,
      status,
      search,
      page,
      limit,
      userRole: actor.role,
      userEmail: actor.email,
    });

    const metrics = await AssetService.getMetrics();

    return NextResponse.json<ApiResponse<any>>({
      success: true,
      data: {
        ...result,
        metrics,
      },
      meta: {
        total: result.total,
        page: result.page,
        limit: result.limit,
        timestamp: new Date().toISOString(),
      },
    });
  } catch (err: any) {
    const correlationId = `corr_${Date.now().toString(36)}`;
    if (err instanceof AssetServiceError) {
      return NextResponse.json<ApiResponse<never>>(
        {
          success: false,
          error: {
            code: err.code,
            message: err.message,
            correlationId,
            details: err.details,
          },
        },
        { status: err.statusCode }
      );
    }

    return NextResponse.json<ApiResponse<never>>(
      {
        success: false,
        error: {
          code: "ERR_INTERNAL_SERVER",
          message: err.message || "Terjadi kesalahan pada server internal.",
          correlationId,
        },
      },
      { status: 500 }
    );
  }
}

export async function POST(req: NextRequest) {
  try {
    const actor = getActor(req);
    const body = await req.json();

    const created = await AssetService.createAsset(body, actor);

    return NextResponse.json<ApiResponse<any>>(
      {
        success: true,
        data: created,
        meta: {
          timestamp: new Date().toISOString(),
        },
      },
      { status: 201 }
    );
  } catch (err: any) {
    const correlationId = `corr_${Date.now().toString(36)}`;
    if (err instanceof AssetServiceError) {
      return NextResponse.json<ApiResponse<never>>(
        {
          success: false,
          error: {
            code: err.code,
            message: err.message,
            correlationId,
            details: err.details,
          },
        },
        { status: err.statusCode }
      );
    }

    return NextResponse.json<ApiResponse<never>>(
      {
        success: false,
        error: {
          code: "ERR_INTERNAL_SERVER",
          message: err.message || "Terjadi kesalahan pada server internal.",
          correlationId,
        },
      },
      { status: 500 }
    );
  }
}
