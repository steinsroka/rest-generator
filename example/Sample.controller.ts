export class SampleController {
  @Get("/folder/:folderId/file/:fileId")
  async getFolderFileById(
    @PathParam("folderId") folderId: string,
    @PathParam("fileId") fileId: string,
    @HeaderParam("Authorization") authorization: string
  ): Promise<GetFolderFileByIdResponse> {
    return null;
  }
}
