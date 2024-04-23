package expo.modules.video.records

import expo.modules.kotlin.records.Field
import expo.modules.kotlin.records.Record
import java.io.Serializable
import java.net.URL

class NotificationData(
  @Field var title: String? = null,
  @Field var secondaryText: String? = null,
  @Field var imageUrl: URL? = null
) : Record, Serializable
