<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class ReportResource extends JsonResource
{
    /**
     * Transform the resource into an array.
     *
     * @return array<string, mixed>
     */
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->id,
            'fk_id_matches'=>$this->fk_id_matches,
            'team1_points'=>$this->team1_points,
            'team2_points'=>$this->team2_points,
        ];
    }
}
